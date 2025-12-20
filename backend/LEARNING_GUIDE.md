# Learning and Training Guide

## Understanding Model "Learning" vs. Training

This guide explains how the JWT Visualiser can "learn" from user interactions and the difference between various approaches.

## ⚠️ Important Clarification

**Ollama models DO NOT automatically train/fine-tune during runtime.**

When you use Ollama (or any LLM), the model:
- ✅ Uses conversation context within the same session
- ✅ Can reference previous messages in the current conversation
- ❌ Does NOT update its weights based on your questions
- ❌ Does NOT permanently "learn" new information
- ❌ Forgets everything when you restart or start a new conversation

## 🎯 Options for Persistent Learning

### Option 1: RAG-Based Learning (Recommended ⭐)

**What it is**: Store Q&A pairs in a vector database and retrieve them for future queries.

**How it works**:
1. User asks a question about a JWT
2. AI generates an answer
3. Q&A pair is stored in ChromaDB (vector database)
4. Future similar questions retrieve past Q&A pairs as context
5. AI uses this context to provide consistent, informed answers

**Advantages**:
- ✅ No training required
- ✅ Works with any LLM (Ollama, Gemini, OpenAI)
- ✅ Instant "learning" - available immediately
- ✅ Can be updated/edited/deleted easily
- ✅ Privacy-preserving (stored locally)
- ✅ Low computational requirements

**Disadvantages**:
- ⚠️ Requires retrieval step (slight latency)
- ⚠️ Storage grows over time
- ⚠️ Quality depends on retrieved context

**Setup**:

```env
# Enable RAG for knowledge retrieval
ENABLE_RAG=true

# Enable Q&A storage for learning from interactions
ENABLE_QA_LEARNING=true

# Vector database path
VECTOR_DB_PATH=./chroma_db
```

**How to use**:

The system automatically:
1. Stores every Q&A pair when `ENABLE_QA_LEARNING=true`
2. Retrieves similar past Q&A pairs when answering new questions
3. Provides this context to the LLM for better responses

### Option 2: Manual Fine-Tuning (Advanced 🔧)

**What it is**: Actually train/update the model weights on your data.

**How it works**:
1. Collect Q&A pairs over time
2. Format them as training data
3. Fine-tune the model using training tools
4. Replace the original model with fine-tuned version

**Advantages**:
- ✅ Model truly "learns" new patterns
- ✅ No retrieval needed at inference
- ✅ Can improve response quality
- ✅ Model becomes specialized for your use case

**Disadvantages**:
- ❌ Requires GPU and significant compute time
- ❌ Risk of overfitting on small datasets
- ❌ Need substantial data (100+ examples)
- ❌ Model updates are permanent (can't easily undo)
- ❌ Complex setup and tooling required

**Tools needed**:
- **Unsloth**: Fast, efficient fine-tuning for Llama models
- **llama.cpp**: Quantized model training
- **HuggingFace Transformers**: Full-featured training pipeline
- **Ollama Modelfile**: Import fine-tuned models back to Ollama

**Process**:

```bash
# 1. Export Q&A pairs from database
python export_qa_data.py > training_data.jsonl

# 2. Fine-tune using unsloth (example)
python fine_tune.py \
  --model llama3.2:3b \
  --data training_data.jsonl \
  --epochs 3 \
  --output jwt-expert-model

# 3. Import to Ollama
ollama create jwt-expert -f Modelfile

# 4. Update .env
OLLAMA_MODEL=jwt-expert
```

### Option 3: Hybrid Approach (Best of Both 🚀)

Combine RAG and fine-tuning:

1. **Short-term**: Use RAG for immediate learning
2. **Long-term**: Periodically fine-tune on accumulated Q&A data
3. **Result**: Fast learning + optimized model

## 📊 Comparison Table

| Feature | RAG Learning | Fine-Tuning | No Learning |
|---------|-------------|-------------|-------------|
| Setup Time | Minutes | Hours/Days | None |
| Compute Required | Minimal | GPU + Time | None |
| Learning Speed | Immediate | Batch-based | N/A |
| Persistence | Database | Model Weights | Session Only |
| Reversibility | Easy | Difficult | N/A |
| Privacy | Local | Local | N/A |
| Quality | Good | Excellent | Base Model |
| Maintenance | Low | Medium | None |

## 🔧 Implementation Details

### RAG-Based Learning Architecture

```
User Question
     ↓
[Retrieve Similar Q&A Pairs from Vector DB]
     ↓
[Combine: Question + Past Q&A Context + JWT Context]
     ↓
[Send to LLM (Ollama/Gemini)]
     ↓
LLM Response
     ↓
[Store New Q&A Pair in Vector DB]
     ↓
Return to User
```

### Storage Format

Q&A pairs are stored as:

```python
{
  "text": "Question: What is the 'sub' claim?\nAnswer: The 'sub' claim...",
  "metadata": {
    "type": "qa_pair",
    "question": "What is the 'sub' claim?",
    "timestamp": "2024-12-18T10:30:00Z",
    "jwt_algorithm": "HS256",
    "has_expiry": true,
    "session_id": "abc123"
  },
  "embedding": [0.123, 0.456, ...]  # Vector representation
}
```

### Retrieval Process

When a user asks: "What does exp mean?"

1. Convert question to vector embedding
2. Find top 3 most similar Q&A pairs (cosine similarity)
3. Example retrieved context:
   ```
   Past Q&A:
   - Q: "What is the exp claim?" A: "The 'exp' claim..."
   - Q: "How do I set expiration?" A: "Set 'exp' to..."
   - Q: "Token expired, what does that mean?" A: "When exp..."
   ```
4. Pass to LLM with current question
5. LLM generates informed response

## 🎓 Best Practices

### When to Use RAG Learning

- ✅ You want persistent knowledge without training
- ✅ You have varied user questions
- ✅ You want to capture organizational knowledge
- ✅ You need quick setup and deployment
- ✅ Privacy is important (local storage)

### When to Consider Fine-Tuning

- ✅ You have 500+ quality Q&A pairs
- ✅ You have GPU resources available
- ✅ Patterns are consistent and repeatable
- ✅ You want model specialization
- ✅ Retrieval latency is problematic

### When to Use Both

- ✅ High-volume production system
- ✅ Long-term deployment (6+ months)
- ✅ Quality is critical
- ✅ Resources are available

## 📈 Monitoring Learning Effectiveness

### Metrics to Track

1. **Retrieval Quality**
   - Relevance score of retrieved Q&A pairs
   - User feedback on answers

2. **Coverage**
   - Percentage of questions with relevant past Q&A
   - Growth of knowledge base over time

3. **Performance**
   - Response time with/without RAG
   - Storage size

### Example Monitoring

```python
# Check Q&A store statistics
from app.vector.qa_store import QAStore

qa_store = QAStore(vector_adapter)
stats = await qa_store.get_qa_statistics()

print(f"Total Q&A pairs: {stats['total_pairs']}")
print(f"Storage enabled: {stats['enabled']}")
```

## 🔒 Privacy Considerations

### RAG Learning
- ✅ All data stored locally in ChromaDB
- ✅ No data sent to external services
- ✅ Can be deleted/cleared easily
- ⚠️ Consider GDPR/privacy laws if storing user data

### Fine-Tuning
- ✅ Training happens locally
- ✅ Model stays on your machine
- ⚠️ If using cloud training, data leaves your infrastructure

## 🛠️ Configuration Examples

### Scenario 1: Development (No Learning)
```env
USE_PAID_LLM=false
OLLAMA_MODEL=llama3.2:3b
ENABLE_RAG=false
ENABLE_QA_LEARNING=false
```

### Scenario 2: Production with Learning
```env
USE_PAID_LLM=false
OLLAMA_MODEL=llama3.2:3b
ENABLE_RAG=true
ENABLE_QA_LEARNING=true
VECTOR_DB_PATH=./chroma_db
```

### Scenario 3: Paid API with RAG
```env
USE_PAID_LLM=true
GOOGLE_API_KEY=your-key
ENABLE_RAG=true
ENABLE_QA_LEARNING=true
```

## 📚 Additional Resources

- [RAG Overview](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Fine-tuning Llama Models](https://github.com/unslothai/unsloth)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Ollama Modelfile Reference](https://github.com/ollama/ollama/blob/main/docs/modelfile.md)

## 🤔 FAQ

**Q: Will Ollama learn from my questions automatically?**  
A: No, but with `ENABLE_QA_LEARNING=true`, the system stores Q&A pairs and retrieves them for future questions, which provides a form of "learning" without training.

**Q: How much storage does Q&A learning use?**  
A: Approximately 1-5KB per Q&A pair. 1000 pairs ≈ 1-5MB.

**Q: Can I delete stored Q&A pairs?**  
A: Yes, they're stored in `./chroma_db` and can be cleared or managed via the ChromaDB API.

**Q: Is fine-tuning worth it for small datasets?**  
A: Usually no. RAG learning is better for <500 examples. Fine-tuning shines with 1000+ examples.

**Q: Can I use both paid and local LLMs with learning?**  
A: Yes! Learning (RAG) works with any LLM backend - Ollama, Gemini, or OpenAI.

**Q: Does this violate privacy?**  
A: If stored locally, no. All data stays on your machine. Consider privacy laws if deploying for users.

