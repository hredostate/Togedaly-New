
import { supabase } from '../supabaseClient';
import type { SupportTicket, SupportTicketMessage, SupportTicketStatus, SupportTicketPriority } from '../types';
import { getTicketSummary } from './geminiService';

// MOCK DB
let mockTickets: SupportTicket[] = [
    { id: 1, user_id: 'mock-user-id', subject: 'My payout is late', status: 'open', priority: 'high', transaction_id: 12345, pool_id: 1, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, user_id: 'user-002', subject: 'Question about GroupBuy', status: 'pending', priority: 'normal', pool_id: 2, created_at: new Date(Date.now() - 2*86400000).toISOString(), updated_at: new Date(Date.now() - 2*86400000).toISOString() },
];
let mockMessages: SupportTicketMessage[] = [
    { id: 101, ticket_id: 1, author_id: 'mock-user-id', is_admin: false, body: 'Hi, I was supposed to receive my Ajo payout yesterday but it has not arrived.', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 102, ticket_id: 1, author_id: 'admin-user', is_admin: true, body: 'Apologies for the delay. We are looking into this and will provide an update shortly.', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 103, ticket_id: 2, author_id: 'user-002', is_admin: false, body: 'What is the delivery timeline for the Sallah Cow Share?', created_at: new Date(Date.now() - 2*86400000).toISOString() },
];

export async function getUserTickets(): Promise<SupportTicket[]> {
    console.log("MOCK: getUserTickets");
    await new Promise(res => setTimeout(res, 300));
    // FIX: v1 compatibility wrapper for getUser
    const auth = supabase.auth as any;
    const user = auth.user ? auth.user() : (await auth.getUser()).data.user;
    
    const userId = user?.id || 'mock-user-id';

    return mockTickets.filter(t => t.user_id === userId).sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function getTicketWithMessages(ticketId: number): Promise<{ ticket: SupportTicket, messages: SupportTicketMessage[] } | null> {
    console.log("MOCK: getTicketWithMessages", ticketId);
    await new Promise(res => setTimeout(res, 400));
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    const messages = mockMessages.filter(m => m.ticket_id === ticketId).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return { ticket, messages };
}

export async function createTicket(subject: string, body: string, userId: string): Promise<SupportTicket> {
    console.log("MOCK: createTicket", { subject, body, userId });
    await new Promise(res => setTimeout(res, 600));
    const newTicket: SupportTicket = {
        id: Date.now(),
        user_id: userId,
        subject,
        status: 'open',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    mockTickets.unshift(newTicket);
    const newMessage: SupportTicketMessage = {
        id: Date.now() + 1,
        ticket_id: newTicket.id,
        author_id: userId,
        is_admin: false,
        body,
        created_at: new Date().toISOString(),
    };
    mockMessages.push(newMessage);
    return newTicket;
}

export async function replyToTicket(ticketId: number, body: string, authorId: string, isAdmin: boolean): Promise<SupportTicketMessage> {
    console.log("MOCK: replyToTicket", { ticketId, body, authorId, isAdmin });
    await new Promise(res => setTimeout(res, 500));
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const newMessage: SupportTicketMessage = {
        id: Date.now(),
        ticket_id: ticketId,
        author_id: authorId,
        is_admin: isAdmin,
        body,
        created_at: new Date().toISOString(),
    };
    mockMessages.push(newMessage);
    ticket.updated_at = new Date().toISOString();
    if (isAdmin && ticket.status === 'open') {
        ticket.status = 'pending'; // Admin reply moves it to pending user response
    } else if (!isAdmin) {
        ticket.status = 'open'; // User reply re-opens it
    }
    return newMessage;
}

// ADMIN functions
export async function getAdminTickets(status: SupportTicketStatus | 'all'): Promise<SupportTicket[]> {
    console.log("MOCK: getAdminTickets", { status });
    await new Promise(res => setTimeout(res, 500));
    const tickets = status === 'all' ? mockTickets : mockTickets.filter(t => t.status === status);
    return tickets.sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function updateTicket(ticketId: number, updates: { status?: SupportTicketStatus, priority?: SupportTicket['priority'] }): Promise<SupportTicket> {
    console.log("MOCK: updateTicket", { ticketId, updates });
    await new Promise(res => setTimeout(res, 400));
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    Object.assign(ticket, updates);
    ticket.updated_at = new Date().toISOString();
    return { ...ticket };
}

export async function summarizeTicketThreadWithAI(messages: { body: string, is_admin: boolean }[]): Promise<string> {
    if (!messages || messages.length === 0) return "No messages to summarize.";
    return getTicketSummary(messages);
}

export async function issueRefundForTicket(
    { ticketId, transactionId, amount, actorId }: 
    { ticketId: number, transactionId: number, amount?: number, actorId: string }
) {
    console.log("Calling RPC: admin_issue_refund", { p_tx_id: transactionId, p_amount: amount, p_ticket: ticketId, p_actor: actorId });
    const { data, error } = await supabase.rpc('admin_issue_refund', {
        p_tx_id: transactionId,
        p_amount: amount ?? null,
        p_ticket: ticketId,
        p_actor: actorId,
    });
    if (error) throw error;

    // In mock, we add a system message
    await replyToTicket(ticketId, `[System] Refund of ₦${amount ? amount.toLocaleString() : 'full amount'} for transaction #${transactionId} has been processed. New transaction ID: ${data}.`, 'system', true);
    
    return { refund_tx_id: data };
}


export async function issueAdjustmentForTicket(
    { ticketId, poolId, userId, amount, reason, actorId }:
    { ticketId: number, poolId: number, userId: string, amount: number, reason: string, actorId: string }
) {
    console.log("Calling RPC: admin_issue_adjustment", { p_pool_id: poolId, p_user: userId, p_amount: amount, p_reason: reason, p_ticket: ticketId, p_actor: actorId });
    const { data, error } = await supabase.rpc('admin_issue_adjustment', {
        p_pool_id: poolId,
        p_user: userId,
        p_amount: amount,
        p_reason: reason,
        p_ticket: ticketId,
        p_actor: actorId,
    });
    if (error) throw error;
    
    // In mock, we add a system message
    const direction = amount > 0 ? 'credit' : 'charge';
    const absAmount = Math.abs(amount);
    await replyToTicket(ticketId, `[System] An adjustment (${direction}) of ₦${absAmount.toLocaleString()} has been issued. Reason: ${reason}. New transaction ID: ${data}.`, 'system', true);

    return { tx_id: data };
}
