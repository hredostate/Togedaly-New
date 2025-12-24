'use client';
import React, { useState } from 'react';
import { useToasts } from './ToastHost';

export default function CommentComposer({ orgId, poolId, target, author, onCommentAdded }: { orgId:number; poolId?:number; target:string; author:string, onCommentAdded?: () => void }){
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const { add: addToast } = useToasts();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
        // In a real app with API routes, this would be a fetch. Here we call the service directly.
        // await fetch('/api/comments/create',{ method:'POST', body: JSON.stringify({ orgId, poolId, target, author, body, rating })});
        // This direct service call is not available here, so we simulate it.
        console.log('Simulating comment creation:', { orgId, poolId, target, author, body, rating });
        await new Promise(res => setTimeout(res, 500));
        addToast({ title: 'Success', desc: 'Comment submitted.', emoji: '✅'});
        setBody('');
        setRating(5);
        if (onCommentAdded) onCommentAdded();
    } catch(e: any) {
        addToast({ title: 'Error', desc: 'Could not submit comment.', emoji: '😥' });
    } finally {
        setSubmitting(false);
    }
  }

  return (
    <div className="border rounded-xl p-3">
      <textarea className="w-full p-2 border rounded" value={body} onChange={e=>setBody(e.target.value)} placeholder="Leave feedback..."/>
      <div className="flex items-center gap-2 mt-2">
        <input type="number" min={1} max={5} value={rating} onChange={e=>setRating(Number(e.target.value))} className="w-16 border p-1 rounded"/>
        <button className="px-3 py-1 rounded bg-black text-white" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
