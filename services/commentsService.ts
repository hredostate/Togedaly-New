// services/commentsService.ts
import type { ChatMessage } from '../types'; // a bit of a stretch but fits
const mockComments: ChatMessage[] = [];
export async function createComment(payload: { orgId:number; poolId?:number; target:string; author:string; body:string; rating:number }){
    // FIX: Correctly construct a ChatMessage object.
    const newComment: ChatMessage = {
        id: Date.now(),
        room_id: payload.poolId || 0,
        org_id: payload.orgId,
        sender: payload.author,
        body: payload.body,
        status: 'ok',
        strikes: 0,
        meta: { rating: payload.rating, target: payload.target },
        created_at: new Date().toISOString()
    };
    mockComments.push(newComment);
    return newComment;
}
export async function getComments(target: string){
    return mockComments.filter(c => c.meta.target === target);
}
