/** Synthetic provider for isolated verification ONLY. Not imported by app code.
 * Binds loopback, creates no real payments, never logs bodies/credentials. */
import http from "node:http";
import { randomBytes } from "node:crypto";
export async function localPayPalProvider() {
 const orders=new Map(), requests=new Map(); let captures=0;
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,"http://127.0.0.1");const send=(status,body)=>{res.writeHead(status,{"Content-Type":"application/json"});res.end(JSON.stringify(body));};
  let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>100000)return send(413,{});}let body={};try{body=raw&&raw!=="grant_type=client_credentials"?JSON.parse(raw):{};}catch{return send(400,{});}
  if(url.pathname==="/v1/oauth2/token")return send(200,{access_token:"synthetic-paypal-token",token_type:"Bearer"});
  if(url.pathname==="/v1/notifications/verify-webhook-signature")return send(200,{verification_status:body.transmission_sig==="synthetic-valid"?"SUCCESS":"FAILURE"});
  if(url.pathname==="/v2/checkout/orders"&&req.method==="POST"){
   const requestId=req.headers["paypal-request-id"];let order=requests.get(requestId);
   if(!order){const id=randomBytes(10).toString("hex").slice(0,17).toUpperCase();order={id,intent:"CAPTURE",status:"CREATED",purchase_units:body.purchase_units,payer:{address:{country_code:"US"}},links:[{rel:"payer-action",href:`https://www.sandbox.paypal.com/checkoutnow?token=${id}`}],__return:body.payment_source.paypal.experience_context.return_url,__cancel:body.payment_source.paypal.experience_context.cancel_url};orders.set(id,order);requests.set(requestId,order);}
   return send(201,order);
  }
  const match=url.pathname.match(/^\/v2\/checkout\/orders\/([A-Z0-9]{17})(\/capture)?$/);
  if(match){const order=orders.get(match[1]);if(!order)return send(404,{});if(match[2]&&req.method==="POST"){
    if(order.status!=="COMPLETED"){
     if(order.status!=="APPROVED")return send(422,{});captures++;const unit=order.purchase_units[0];const [major,fraction=""]=unit.amount.value.split(".");const amount=Number(major)*100+Number(fraction.padEnd(2,"0"));
     // Synthetic test fee, NOT a production PayPal rate or fee quote.
     const whole=["JPY","HUF","TWD"].includes(unit.amount.currency_code),fee=Math.min(amount,whole?400:470),format=v=>whole?String(v/100):`${Math.floor(v/100)}.${String(v%100).padStart(2,"0")}`;
     order.status="COMPLETED";unit.payments={captures:[{id:randomBytes(10).toString("hex").slice(0,17).toUpperCase(),status:"COMPLETED",final_capture:true,amount:unit.amount,seller_receivable_breakdown:{gross_amount:unit.amount,paypal_fee:{currency_code:unit.amount.currency_code,value:format(fee)},net_amount:{currency_code:unit.amount.currency_code,value:format(amount-fee)}}}]};
    }
   }return send(200,order);
  }
  if(url.pathname==="/__test/state")return send(200,{orders:[...orders.values()],captures});
  if(url.pathname==="/__test/approve"&&req.method==="POST"){const order=orders.get(body.orderId);if(!order)return send(404,{});order.status="APPROVED";return send(200,{returnUrl:`${order.__return}&token=${order.id}`,cancelUrl:order.__cancel});}
  return send(404,{});
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 return{origin:`http://127.0.0.1:${server.address().port}`,async close(){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
