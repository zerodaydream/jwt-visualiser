from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from app.api.schemas import TokenRequest, TokenResponse, AnalysisResult
from app.jwt.decoder import SafeDecoder
from app.jwt.analysis import JwtAnalyzer
from app.vector.chroma_adapter import ChromaAdapter
from app.llm.factory import LLMFactory
from app.api.schemas import AskRequest, AskResponse
from app.jwt.generator import JwtGenerator
from app.api.schemas import GenerateRequest, GenerateResponse
import json
import asyncio
import traceback
from datetime import datetime

router = APIRouter()

# RAG configured via settings.ENABLE_RAG 
vector_store = ChromaAdapter()

@router.post("/decode", response_model=TokenResponse)
async def decode_token(request: TokenRequest):
    """
    Decodes a JWT and provides a security analysis and human-readable explanation.
    Does NOT verify the signature cryptographically.
    """
    if not request.token:
        raise HTTPException(status_code=400, detail="Token cannot be empty")

    try:
        # 1. Decode
        decoded = SafeDecoder.decode(request.token)
        
        # 2. Analyze
        analysis_data = JwtAnalyzer.analyze(decoded.header, decoded.payload)
        
        # 3. Construct Response
        return TokenResponse(
            success=True,
            header=decoded.header,
            payload=decoded.payload,
            signature=decoded.signature,
            analysis=AnalysisResult(**analysis_data)
        )

    except ValueError as e:
        # Handle known decoding errors (bad format, etc.)
        # We return 200 OK with success=False so the UI can show the error gracefully
        return TokenResponse(
            success=False,
            header={},
            payload={},
            analysis=AnalysisResult(
                header_explanation="",
                claims_explanation=[],
                status="INVALID",
                risk_warnings=[]
            ),
            error=str(e)
        )

@router.post("/ask", response_model=AskResponse)
async def ask_jwt_question(request: AskRequest):
    """
    RAG Endpoint: 
    1. Decodes the token context.
    2. Searches Vector DB for relevant JWT specs.
    3. Sends everything to LLM.
    """
    
    # 1. Get Token Context (Decode it safely)
    try:
        decoded = SafeDecoder.decode(request.token)
        # Simplify context for LLM
        token_context = {
            "header": decoded.header,
            "payload": decoded.payload,
            "signature_present": bool(decoded.signature)
        }
    except Exception:
        token_context = {"error": "Token could not be decoded"}

    # 2. Retrieve Documents (RAG) - only if enabled
    from app.core.config import settings
    if settings.ENABLE_RAG and vector_store.embedding_fn:
        relevant_docs = vector_store.similarity_search(request.question)
    else:
        relevant_docs = []

    # 3. Call LLM
    llm = LLMFactory.get_provider()
    
    # Combine RAG docs + Token Context + Conversation History
    full_context = {
        "jwt_data": token_context,
        "knowledge_base": relevant_docs,
        "conversation_history": [msg.dict() for msg in request.history]
    }
    
    answer = await llm.generate_response(request.question, full_context)
    
    return AskResponse(
        answer=answer,
        context_used=relevant_docs
    )

@router.post("/ask/stream")
async def ask_jwt_question_stream(request: AskRequest):
    """
    Streaming RAG Endpoint using Server-Sent Events (SSE).
    Returns real-time streaming responses for better UX.
    
    Response format: Server-Sent Events (SSE)
    - data: {json with chunk and done status}
    - Final message includes context_used
    """
    
    # 1. Get Token Context (Decode it safely)
    try:
        decoded = SafeDecoder.decode(request.token)
        token_context = {
            "header": decoded.header,
            "payload": decoded.payload,
            "signature_present": bool(decoded.signature)
        }
    except Exception:
        token_context = {"error": "Token could not be decoded"}

    # 2. Retrieve Documents (RAG) - only if enabled
    from app.core.config import settings
    if settings.ENABLE_RAG and vector_store.embedding_fn:
        relevant_docs = vector_store.similarity_search(request.question)
    else:
        relevant_docs = []

    # 3. Prepare LLM context
    llm = LLMFactory.get_provider()
    full_context = {
        "jwt_data": token_context,
        "knowledge_base": relevant_docs,
        "conversation_history": [msg.dict() for msg in request.history]
    }
    
    # 4. Stream generator function
    async def generate_sse_stream():
        """
        Generator that yields Server-Sent Events format.
        Production-ready with proper error handling and connection management.
        """
        full_response = ""
        try:
            # Stream chunks from LLM
            async for chunk in llm.generate_response_stream(request.question, full_context):
                if chunk:
                    full_response += chunk
                    # SSE format: "data: {json}\n\n"
                    event_data = json.dumps({
                        "chunk": chunk,
                        "done": False
                    })
                    yield f"data: {event_data}\n\n"
                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.01)
            
            # Send final message with context_used
            final_event = json.dumps({
                "chunk": "",
                "done": True,
                "full_response": full_response,
                "context_used": relevant_docs
            })
            yield f"data: {final_event}\n\n"
            
        except Exception as e:
            # Send error as SSE event
            error_event = json.dumps({
                "chunk": "",
                "done": True,
                "error": str(e)
            })
            yield f"data: {error_event}\n\n"
    
    # Return streaming response with proper headers for SSE
    return StreamingResponse(
        generate_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable buffering in nginx
        }
    )

@router.post("/generate", response_model=GenerateResponse)
async def generate_token(request: GenerateRequest):
    """
    Generates a signed JWT with the provided payload, secret, and settings.
    """
    try:
        token = JwtGenerator.generate_token(
            payload=request.payload,
            secret=request.secret,
            algorithm=request.algorithm,
            expires_in_minutes=request.expires_in_minutes
        )
        
        return GenerateResponse(
            success=True,
            token=token
        )

    except ValueError as e:
        return GenerateResponse(
            success=False,
            token="",
            error=str(e)
        )

@router.websocket("/ask/ws")
async def websocket_ask_endpoint(websocket: WebSocket):
    """
    Production-ready WebSocket endpoint for real-time JWT Q&A with streaming responses.
    
    Features:
    - Full connection lifecycle management
    - Authentication status
    - Token-by-token streaming
    - Detailed error reporting
    - Connection health monitoring
    
    Message Protocol:
    Client -> Server:
    {
        "type": "ask",
        "token": "jwt_token_string",
        "question": "user question",
        "history": [{"role": "user/assistant", "content": "..."}]
    }
    
    Server -> Client:
    {
        "type": "connection" | "auth" | "chunk" | "complete" | "error" | "heartbeat",
        "data": {...},
        "timestamp": "ISO timestamp"
    }
    """
    client_id = id(websocket)
    await websocket.accept()
    
    # Send connection established message
    await websocket.send_json({
        "type": "connection",
        "status": "connected",
        "client_id": str(client_id),
        "timestamp": datetime.utcnow().isoformat(),
        "message": "WebSocket connection established"
    })
    
    try:
        while True:
            # Receive message from client
            try:
                data = await websocket.receive_json()
            except json.JSONDecodeError as e:
                await websocket.send_json({
                    "type": "error",
                    "error": "Invalid JSON format",
                    "details": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
                continue
            
            if data.get("type") == "ping":
                # Respond to heartbeat
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
                continue
            
            if data.get("type") != "ask":
                await websocket.send_json({
                    "type": "error",
                    "error": "Unknown message type",
                    "received_type": data.get("type"),
                    "timestamp": datetime.utcnow().isoformat()
                })
                continue
            
            # Extract request data
            jwt_token = data.get("token")
            question = data.get("question")
            history = data.get("history", [])
            
            if not jwt_token or not question:
                await websocket.send_json({
                    "type": "error",
                    "error": "Missing required fields",
                    "required": ["token", "question"],
                    "timestamp": datetime.utcnow().isoformat()
                })
                continue
            
            # Send authentication status
            await websocket.send_json({
                "type": "auth",
                "status": "validating",
                "message": "Validating JWT token",
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Decode token
            try:
                decoded = SafeDecoder.decode(jwt_token)
                token_context = {
                    "header": decoded.header,
                    "payload": decoded.payload,
                    "signature_present": bool(decoded.signature)
                }
                
                await websocket.send_json({
                    "type": "auth",
                    "status": "validated",
                    "message": "Token successfully decoded",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "error": "Token decode failed",
                    "details": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                })
                continue
            
            # RAG search
            from app.core.config import settings
            if settings.ENABLE_RAG and vector_store.embedding_fn:
                relevant_docs = vector_store.similarity_search(question)
                await websocket.send_json({
                    "type": "rag",
                    "status": "retrieved",
                    "doc_count": len(relevant_docs),
                    "timestamp": datetime.utcnow().isoformat()
                })
            else:
                relevant_docs = []
                await websocket.send_json({
                    "type": "rag",
                    "status": "disabled",
                    "message": "RAG is not enabled",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Prepare LLM context
            llm = LLMFactory.get_provider()
            full_context = {
                "jwt_data": token_context,
                "knowledge_base": relevant_docs,
                "conversation_history": history
            }
            
            # Send streaming started
            await websocket.send_json({
                "type": "stream_start",
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Stream response token by token
            full_response = ""
            token_count = 0
            
            try:
                async for chunk in llm.generate_response_stream(question, full_context):
                    if chunk:
                        full_response += chunk
                        token_count += 1
                        
                        # Send each token/chunk
                        await websocket.send_json({
                            "type": "chunk",
                            "content": chunk,
                            "token_number": token_count,
                            "cumulative_length": len(full_response),
                            "timestamp": datetime.utcnow().isoformat()
                        })
                
                # Send completion message
                await websocket.send_json({
                    "type": "complete",
                    "full_response": full_response,
                    "token_count": token_count,
                    "context_used": relevant_docs,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
            except Exception as e:
                error_details = {
                    "type": "error",
                    "error": "Streaming failed",
                    "details": str(e),
                    "traceback": traceback.format_exc(),
                    "timestamp": datetime.utcnow().isoformat()
                }
                await websocket.send_json(error_details)
    
    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "error": "Internal server error",
                "details": str(e),
                "traceback": traceback.format_exc(),
                "timestamp": datetime.utcnow().isoformat()
            })
        except:
            pass
        finally:
            try:
                await websocket.close()
            except:
                pass