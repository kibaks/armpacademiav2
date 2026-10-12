process.env.FIREBASE_SERVICE_ACCOUNT_ID = 'firebase-adminsdk-fbsvc@gen-lang-client-0775786837.iam.gserviceaccount.com';
const { services } = await import('../backend/services');
try { const token = await services().auth.createCustomToken('academia-signer-diagnostic'); console.log(JSON.stringify({signed: !!token})); }
catch (error: any) { console.error(JSON.stringify({code:error.code,message:error.message})); process.exitCode=1; }
