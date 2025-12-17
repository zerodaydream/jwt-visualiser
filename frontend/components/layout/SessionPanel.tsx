'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Code, Eye, MessageSquare, PlusCircle } from 'lucide-react';

const menuItems = [
  { name: 'Decode', href: '/decode', icon: Code },
  { name: 'Visualise', href: '/visualise', icon: Eye },
  { name: 'Ask AI', href: '/ask', icon: MessageSquare },
  { name: 'Generate', href: '/generate', icon: PlusCircle }
];

export function SessionPanel() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-claude-surface border-r border-claude-border flex flex-col p-4 fixed left-0 top-0 z-40">
      <div className="mb-8 mt-2 px-2">
        <h1 className="text-claude-text font-serif text-2xl tracking-tight">
          JWT Visualiser
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="block relative group">
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-claude-input rounded-md"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`relative flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'text-claude-text' : 'text-claude-subtext group-hover:text-claude-text'}`}>
                <item.icon size={18} />
                <span className="font-sans text-sm font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="text-xs text-claude-subtext opacity-50 font-mono px-3">
        v1.0.0 • Local
      </div>
    </aside>
  );
}