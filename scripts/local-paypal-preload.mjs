/** Test child-process preload only. Production API URLs stay code-owned.
 * Even a test misconfiguration must never contact a live PayPal endpoint. */
const target=new URL(process.env.PAYPAL_MOCK_ORIGIN||"");
if(target.protocol!=="http:"||target.hostname!=="127.0.0.1"||target.username||target.password||target.pathname!=="/"||target.search||target.hash)throw Error("Synthetic PayPal provider must be loopback");
const original=globalThis.fetch.bind(globalThis);
globalThis.fetch=(input,init)=>{
 const url=new URL(typeof input==="string"||input instanceof URL?input:input.url);
 if(["api-m.sandbox.paypal.com","api.sandbox.paypal.com"].includes(url.hostname))return original(new URL(url.pathname+url.search,target),init);
 if(url.hostname==="paypal.com"||url.hostname.endsWith(".paypal.com")||url.hostname==="api.razorpay.com")throw Error("Real gateway network forbidden in isolated verification");
 return original(input,init);
};
