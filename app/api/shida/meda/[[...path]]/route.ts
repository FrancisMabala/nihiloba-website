export const dynamic='force-dynamic';
export async function GET(){return Response.json({detail:'meda_sign_in_required'},{status:401,headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}})}
