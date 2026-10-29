import { Router, type RequestHandler } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { authenticate, services } from './admin.js';
import { buildCourseCatalog } from '../shared/courseCatalog.js';
const COURSES_DATA = buildCourseCatalog();
import { LEGAL_DOCS } from '../src/data/legalDocsData.js';
import { courseActivity, gradeCourse, learner, operationalAnalytics, privileged, teaches } from '../shared/operationalStats.js';
import type { CourseModule, UserProfile } from '../src/types.js';
import { generateQwenTutor, generateQwenAuthor } from './qwenTutor.js';

const fail = (status: number, message: string) => Object.assign(new Error(message), { status });
const validId = (value: unknown) => typeof value === 'string' && /^[\w-]{1,128}$/.test(value);
export function createOperationsRouter(deps: { authenticate?: RequestHandler; db?: any; generate?: typeof generateQwenTutor } = {}) {
  const router = Router();
  const db = () => deps.db || services().db;
  const wrap = (fn: (req: any, res: any) => Promise<any>): RequestHandler => (req, res, next) => { void fn(req, res).catch(next); };
  const profile = async (id: string) => { const s = await db().collection('users').doc(id).get(); if (!s.exists) throw fail(404, 'Profil introuvable.'); return { ...s.data(), id } as UserProfile; };
  const catalog = async () => { const remote = await db().collection('courses').get(); const map = new Map(COURSES_DATA.map(c => [c.id, c])); remote.docs.forEach((d: any) => { if (!COURSES_DATA.some(c=>c.id===d.id && c.level==='Fondamental')) map.set(d.id, { ...d.data(), id: d.id }); }); return [...map.values()]; };
  const course = async (id: string) => { if (!validId(id)) throw fail(400, 'Module invalide.'); const c = (await catalog()).find(c => c.id === id); if (!c) throw fail(404, 'Module introuvable.'); return c; };
  const staff = async (req: any, c?: CourseModule) => { const p = await profile(req.identity.uid); if (!privileged(p.role) && !(p.role === 'formateur' && (!c || teaches(p, c)))) throw fail(403, 'Module hors de votre périmètre de formation.'); return p; };
  const list = async (name: string) => (await db().collection(name).get()).docs.map((d: any) => ({ ...d.data(), id: d.id }));
  router.use(deps.authenticate || authenticate, (_req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
  router.post('/recommendations',wrap(async (req,res) => {
    const p=await profile(req.identity.uid), cs=await catalog();
    const eligible=cs.filter(c=>!c.targetAudience?.length || c.targetAudience.includes(p.role) || c.level==='Fondamental');
    const ranked=eligible.filter(c=>!p.certificates?.some(cert=>cert.courseId===c.id)).sort((a,b)=>(p.quizScoresByCourse?.[a.id] ?? 101)-(p.quizScoresByCourse?.[b.id] ?? 101));
    res.json({source:'recorded-progression',summary:'Suggestions fondées sur votre rôle, les modules disponibles et vos résultats enregistrés.',modules:ranked.slice(0,3).map(c=>({id:c.id,title:c.title,priority:(p.quizScoresByCourse?.[c.id] ?? 100)<70?'Haute':'Normale',reason:typeof p.quizScoresByCourse?.[c.id]==='number'?`Dernier score enregistré : ${p.quizScoresByCourse[c.id]}%.`:'Module adapté à votre profil, sans attestation enregistrée.'}))});
  }));
  router.post('/generate-animated-module',wrap(async (req,res) => {
    await staff(req);
    const b=req.body;
    if(typeof b.sourceText!=='string' || b.sourceText.trim().length<20 || b.sourceText.length>30000 || typeof b.sourceTitle!=='string' || b.sourceTitle.length>250) throw fail(400,'Titre et contenu source requis (20 à 30 000 caractères).');
    const text:string=await (deps.generate || generateQwenAuthor)(`Tu prépares un brouillon pédagogique pour un formateur. Réponds uniquement avec un objet JSON valide sans Markdown : {"title":"...","description":"...","lessons":[{"title":"...","content":"...","duration":"10 min","keyArticles":[]}],"quiz":[{"question":"...","options":["...","...","...","..."],"correctIndex":0,"explanation":"..."}]}. Fais exactement 2 chapitres de 40 mots et 2 questions très courtes. Limite le JSON à 2 000 caractères. N'invente pas de référence légale absente du contenu source. Titre : ${b.sourceTitle}. Source : ${b.sourceText.slice(0,20000)}`);
    let module:any; try { module=JSON.parse(text.slice(text.indexOf('{'),text.lastIndexOf('}')+1)); }catch {throw fail(502,'Le moteur n’a pas produit un module valide. Réessayez.');}
    const valid=module && typeof module.title==='string' && module.title.trim() && typeof module.description==='string' && Array.isArray(module.lessons) && module.lessons.length>=1 && module.lessons.length<=12 && module.lessons.every((l:any)=>typeof l.title==='string' && typeof l.content==='string' && l.content.trim()) && Array.isArray(module.quiz) && module.quiz.length>=1 && module.quiz.length<=20 && module.quiz.every((q:any)=>typeof q.question==='string' && Array.isArray(q.options) && q.options.length===4 && q.options.every((v:any)=>typeof v==='string' && v.trim()) && Number.isInteger(q.correctIndex) && q.correctIndex>=0 && q.correctIndex<4);
    if(!valid) throw fail(502,'Le module généré est incomplet. Aucune publication effectuée. Réessayez.');
    res.json({module:{...module,code:`IA-${Date.now().toString(36).toUpperCase()}`,category:b.category,level:b.level,legalRef:b.legalRef,targetAudience:b.targetAudience},source:'local-qwen',reviewRequired:true});
  }));
  router.get('/profiles', wrap(async (req,res) => {
    const self = await profile(req.identity.uid);
    if (privileged(self.role)) return res.json({ profiles: await list('users') });
    if (self.role !== 'formateur') return res.json({ profiles: [self] });
    const cs = (await catalog()).filter(c => teaches(self,c));
    const people = (await list('users')).filter((p: UserProfile) => learner(p) && cs.some(c => courseActivity(p,c)));
    // Expose learning fields for the assigned modules only; civil identity and private notes stay private.
    const ids = new Set(cs.flatMap(c => [c.id,c.code]));
    const scopedMap = (map: any) => Object.fromEntries(Object.entries(map || {}).filter(([id]) => ids.has(id)));
    res.json({ profiles: people.map((p: UserProfile) => ({ id:p.id, name:p.name, role:p.role, roleTitle:p.roleTitle, institution:p.institution, avatarUrl:p.avatarUrl, level:p.level, completedModulesCount:0, certificationsCount:0, offlineDownloads:[], courseProgress:scopedMap(p.courseProgress), completedLessonsByCourse:scopedMap(p.completedLessonsByCourse), quizScoresByCourse:scopedMap(p.quizScoresByCourse), studyMinutesByCourse:scopedMap(p.studyMinutesByCourse), certificates:(p.certificates || []).filter(c => ids.has(c.courseId)), registeredCourseIds:(p.registeredCourseIds || []).filter(id => ids.has(id)), assignedCourseIds:(p.assignedCourseIds || []).filter(id => ids.has(id)), completedCourseIds:(p.completedCourseIds || []).filter(id => ids.has(id)), recentReadings:(p.recentReadings || []).filter(r => ids.has(r.courseId)) })) });
  }));
  router.get('/analytics', wrap(async (req,res) => {
    if (!privileged(req.identity.role)) throw fail(403, 'Accès administrateur requis.');
    const [ps, cs, rs] = await Promise.all([list('users'), catalog(), list('trainingRequests')]);
    let data; try { data = operationalAnalytics(ps, cs, rs, String(req.query.period || 'Toutes les périodes'), String(req.query.institution || 'Toutes')); } catch { throw fail(400, 'Période invalide.'); }
    res.json(data);
  }));
  router.post(['/analytics/report','/generate-report'], wrap(async (req,res) => {
    if (!privileged(req.identity.role)) throw fail(403, 'Accès administrateur requis.');
    const [ps,cs,rs] = await Promise.all([list('users'),catalog(),list('trainingRequests')]);
    let s; try { s=operationalAnalytics(ps,cs,rs,String(req.body.period || 'Toutes les périodes'),String(req.body.institution || 'Toutes')); } catch { throw fail(400,'Période invalide.'); }
    const report = { id:`REP-${randomUUID()}`, reportTitle:`Synthèse des données enregistrées — ${s.period}`, generatedAt:new Date().toISOString(), period:s.period, institution:String(req.body.institution || 'Toutes'), executiveSummary:`${s.totalLearners} apprenants avec une activité ou inscription enregistrée, ${s.certifications} attestations et ${s.hoursDelivered} heures mesurées sur la période sélectionnée.`, keyObservations:[`${s.globalPassRate}% de réussite parmi les derniers scores enregistrés des apprenants actifs.`,`${s.cgpmpStats.approved} demandes de formation approuvées sur ${s.cgpmpStats.total}.`,s.dataNote], complianceScore:s.globalPassRate, recommendationsDFAT:s.totalLearners ? 'Examiner les scores par module et les demandes en attente avant de planifier les sessions de renforcement.' : 'Aucune activité mesurable pour cette sélection. Élargir la période ou inscrire les apprenants.', source:'recorded-data', createdBy:req.identity.uid };
    await db().collection('analyticsReports').doc(report.id).set(report); res.status(201).json(report);
  }));
  router.post('/courses/:id/attempt', wrap(async (req,res) => {
    const c=await course(req.params.id); let result; try { result=gradeCourse(c,req.body.answers); } catch (e:any) { throw fail(400,e.message); }
    const uid=req.identity.uid, userRef=db().collection('users').doc(uid), attemptRef=db().collection('courseAttempts').doc();
    const certId=createHash('sha256').update(`${uid}:${c.id}`).digest('hex').slice(0,24);
    const updated=await db().runTransaction(async (tx:any) => {
      const snap=await tx.get(userRef); const canonical=await tx.get(db().collection('courseCertificates').doc(certId)); if (!snap.exists) throw fail(404,'Profil introuvable.'); const p=snap.data();
      if (!privileged(p.role) && p.role !== 'formateur' && c.targetAudience?.length && !c.targetAudience.includes(p.role) && c.level !== 'Fondamental') throw fail(403,'Ce module ne correspond pas à votre parcours.');
      const read=new Set((p.completedLessonsByCourse?.[c.id] || []).filter((i:number) => Number.isInteger(i) && i>=0 && i<c.lessons.length));
      if (read.size<c.lessons.length) throw fail(409,'Validez chaque chapitre avant de passer l’évaluation finale.');
      const verified=canonical.exists ? canonical.data() : null;
      const issued=verified || (result.passed ? {id:`CERT-${certId}`,courseId:c.id,courseCode:c.code,courseTitle:c.title,score:result.score,issuedAt:new Date().toISOString(),sealNumber:`ACADEMIA-${certId.toUpperCase()}`,source:'server-assessment',status:'pedagogical'} : null);
      const certs=[...(p.certificates || []).filter((cert:any)=>cert.courseId!==c.id),...(issued?[issued]:[])];
      const completed=[...new Set([...(p.completedCourseIds || []),...(result.passed ? [c.id]:[])])];
      const patch={ quizScoresByCourse:{...(p.quizScoresByCourse || {}),[c.id]:result.score}, completedCourseIds:completed, completedModulesCount:completed.length, certificates:certs, certificationsCount:certs.length };
      if(result.passed) tx.set(db().collection('courseCertificates').doc(certId),{...certs.find(cert=>cert.courseId===c.id),profileId:uid,source:'server-assessment'}, {merge:true});
      tx.update(userRef,patch); tx.set(attemptRef,{ ...result,id:attemptRef.id,courseId:c.id,profileId:uid,createdAt:new Date().toISOString() }); return {...p,...patch,id:uid};
    });
    res.json({ ...result, profile:updated, certificate:updated.certificates.find((cert:any) => cert.courseId===c.id) || null });
  }));
  router.post('/courses/:id/study', wrap(async (req,res) => {
    const c=await course(req.params.id), seconds=req.body.seconds;
    if (!Number.isInteger(seconds) || seconds<10 || seconds>90) throw fail(400,'Durée d’activité invalide.');
    const ref=db().collection('users').doc(req.identity.uid), day=new Date().toISOString().slice(0,10), now=Date.now();
    await db().runTransaction(async (tx:any) => { const s=await tx.get(ref); if(!s.exists) throw fail(404,'Profil introuvable.'); const p=s.data(); const elapsed=Math.min(seconds, Math.max(0,(now-(p.studyTimerAt || (now-seconds*1000)))/1000)); const minutes=elapsed/60; tx.update(ref,{totalStudyMinutes:(p.totalStudyMinutes || 0)+minutes, studyMinutesByCourse:{...(p.studyMinutesByCourse || {}),[c.id]:(p.studyMinutesByCourse?.[c.id] || 0)+minutes}, studyMinutesByDay:{...(p.studyMinutesByDay || {}),[day]:(p.studyMinutesByDay?.[day] || 0)+minutes},studyTimerAt:now}); }); res.json({ok:true});
  }));
  router.post('/training/:id/decision',wrap(async(req,res)=>{
    if(!privileged(req.identity.role)) throw fail(403,'Accès administrateur requis.');
    if(!validId(req.params.id) || !['Approuvé par DFAT','Rejeté'].includes(req.body.status) || typeof req.body.note!=='string' || req.body.note.length>4000) throw fail(400,'Décision invalide.');
    const ref=db().collection('trainingRequests').doc(req.params.id),audit=db().collection('adminAudit').doc();
    const request=await db().runTransaction(async(tx:any)=>{const snap=await tx.get(ref);if(!snap.exists)throw fail(404,'Demande introuvable.');const p=snap.data();if(p.status!=='En attente')throw fail(409,'Cette demande a déjà reçu une décision. Rechargez la liste.');const patch={status:req.body.status,dfatNote:req.body.note.trim(),decidedAt:new Date().toISOString()};tx.update(ref,patch);tx.set(audit,{actor:req.identity.uid,action:'training.decision',target:req.params.id,date:patch.decidedAt});return {...p,...patch,id:req.params.id};});res.json({request});
  }));
  router.get('/trainer/observations', wrap(async (req,res) => { await staff(req); const snap=await db().collection('trainerObservations').where('trainerId','==',req.identity.uid).get(); res.json({ observations:Object.fromEntries(snap.docs.map((d:any) => {const v=d.data(); return [`${v.learnerId}_${v.courseId}`,v.text];})) }); }));
  router.post('/trainer/observations', wrap(async (req,res) => {
    const c=await course(req.body.courseId); await staff(req,c); if (!validId(req.body.learnerId) || typeof req.body.text!=='string' || req.body.text.length>4000) throw fail(400,'Observation invalide.'); const p=await profile(req.body.learnerId); if (!learner(p) || !courseActivity(p,c)) throw fail(403,'Cet apprenant n’est pas inscrit à ce module.');
    const key=createHash('sha256').update(`${req.identity.uid}:${p.id}:${c.id}`).digest('hex');
    await db().collection('trainerObservations').doc(key).set({trainerId:req.identity.uid,learnerId:p.id,courseId:c.id,text:req.body.text.trim(),updatedAt:new Date().toISOString()}); res.json({ok:true});
  }));
  router.post('/trainer/certify', wrap(async (req,res) => {
    const c=await course(req.body.courseId); await staff(req,c); const p=await profile(String(req.body.learnerId));
    const saved=await db().collection('courseCertificates').doc(createHash('sha256').update(`${p.id}:${c.id}`).digest('hex').slice(0,24)).get();
    const cert=saved.exists ? saved.data() : null;
    if (!cert || !courseActivity(p,c)) throw fail(409,'L’apprenant doit réussir l’évaluation finale ; un formateur ne peut pas inventer un résultat.');
    await db().collection('adminAudit').add({actor:req.identity.uid,action:'certificate.review',target:cert.id,date:new Date().toISOString()}); res.json({certificate:cert});
  }));
  for (const action of ['like','comment']) router.post(`/posts/:id/${action}`,wrap(async (req,res) => {
    if(!validId(req.params.id)) throw fail(400,'Publication invalide.');
    const ref=db().collection('posts').doc(req.params.id), author=await profile(req.identity.uid);
    const post=await db().runTransaction(async (tx:any) => { const s=await tx.get(ref); if(!s.exists) throw fail(404,'Publication introuvable.'); const p=s.data(); let patch;
      if(action==='like') { if(typeof req.body.liked!=='boolean') throw fail(400,'État de réaction requis.'); const likes=new Set<string>(p.likedBy || []); req.body.liked ? likes.add(author.id) : likes.delete(author.id); patch={likedBy:[...likes],likes:likes.size}; }
      else { if(typeof req.body.text!=='string' || !req.body.text.trim() || req.body.text.length>1500) throw fail(400,'Commentaire requis (1 500 caractères maximum).'); if((p.comments || []).length>=500) throw fail(409,'Limite de commentaires atteinte.'); patch={comments:[...(p.comments || []),{id:randomUUID(),authorId:author.id,author:author.name,avatar:author.avatarUrl || '',text:req.body.text.trim(),timeAgo:'À l’instant',createdAt:new Date().toISOString()}]}; }
      tx.update(ref,patch); return {...p,...patch,id:req.params.id}; }); res.json({post:{...post,userLiked:(post.likedBy || []).includes(author.id)}});
  }));
  router.post(['/courses/:id/presentation','/presentation'],wrap(async (req,res) => {
    const c=req.params.id ? await course(req.params.id) : {id:'draft',code:String(req.body.code || 'BROUILLON').slice(0,50),title:String(req.body.title || 'Présentation pédagogique').slice(0,250),description:''} as CourseModule; await staff(req,req.params.id ? c : undefined); const prompt=req.body.prompt; if(typeof prompt!=='string' || !prompt.trim() || prompt.length>6000) throw fail(400,'Consigne de présentation requise (6 000 caractères maximum).');
    const text:string=await (deps.generate || generateQwenAuthor)(`Prépare une présentation pédagogique en français pour le formateur. Fais 6 diapositives séparées exactement par ===. Pour chacune : titre sur la première ligne puis 3 à 5 puces courtes. Contenu source (ne pas inventer d’articles ou de chiffres) : ${c.title}\n${String(req.body.content || c.description).slice(0,10000)}\nConsigne : ${prompt}`);
    const slides=text.split(/\n?===\n?/).map(s=>s.trim()).filter(Boolean).slice(0,12); if(slides.length<2) throw fail(502,'La génération ne contient pas plusieurs diapositives. Réessayez.');
    const {default:PptxGenJS}=await import('pptxgenjs'); const ppt=new PptxGenJS(); ppt.layout='LAYOUT_WIDE'; ppt.author=req.identity.name || 'Academia'; ppt.subject=c.title; ppt.title=c.title;
    slides.forEach((s,i)=> {const lines=s.split('\n').filter(Boolean), slide=ppt.addSlide(); slide.background={color:'F5F8FC'}; slide.addText(lines.shift()!.replace(/^#+\s*/,''),{x:0.6,y:0.5,w:12,h:0.9,fontSize:27,bold:true,color:'114488'}); slide.addText(lines.join('\n'),{x:0.8,y:1.65,w:11.7,h:4.8,fontSize:21,color:'203047',breakLine:false,fit:'shrink'}); slide.addText(`${c.code} • Support généré, à relire par le formateur • ${i+1}`,{x:0.6,y:7,w:12,h:0.2,fontSize:10,color:'64748B'}); });
    const buffer=await ppt.write({outputType:'nodebuffer'}); res.type('application/vnd.openxmlformats-officedocument.presentationml.presentation').set('Content-Disposition',`attachment; filename="presentation-${c.code.replace(/[^\w-]/g,'')}.pptx"`).send(buffer);
  }));
  router.get('/courses/:id/document',wrap(async (req,res) => {
    const c=await course(req.params.id), kind=String(req.query.kind || 'support');
    const {default:PDFDocument}=await import('pdfkit'); const pdf=new PDFDocument({size:'A4',margin:48});
    let cert:any; if(kind==='certificate') { const p=await profile(req.identity.uid); const record=await db().collection('courseCertificates').doc(createHash('sha256').update(`${req.identity.uid}:${c.id}`).digest('hex').slice(0,24)).get(); cert=record.exists && record.data().profileId===req.identity.uid ? record.data() : null; if(!cert) throw fail(404,'Aucune attestation vérifiée pour ce module. Réussissez l’évaluation finale.'); cert={...cert,name:p.name}; }
    res.type('application/pdf').set('Content-Disposition',`attachment; filename="${kind==='certificate'?'attestation':'support'}-${c.code.replace(/[^\w-]/g,'')}.pdf"`); pdf.pipe(res);
    pdf.fillColor('#114488').fontSize(22).text('ARMP ACADEMIA'); pdf.moveDown(); pdf.fontSize(17).text(cert?'Attestation pédagogique':`Support de formation — ${c.code}`); pdf.moveDown(); pdf.fillColor('#203047').fontSize(14).text(c.title); pdf.moveDown();
    if(cert) { pdf.fontSize(12).text(`Apprenant : ${cert.name}`).moveDown().text(`Évaluation réussie : ${cert.score}%`).text(`Date : ${new Date(cert.issuedAt).toLocaleDateString('fr-FR')}`).text(`Référence stable : ${cert.sealNumber}`).moveDown().text('Cette attestation constate la réussite pédagogique dans Academia. Elle ne constitue pas une homologation administrative ni une signature de la DFAT.'); }
    else { pdf.fontSize(10).text('Support pédagogique issu du module enregistré. Les références citées doivent être rapprochées des textes officiels en vigueur.'); c.lessons.forEach(l=> {pdf.moveDown().fontSize(14).fillColor('#114488').text(l.title); pdf.moveDown().fontSize(11).fillColor('#203047').text(l.content.replace(/\[Sc[èe]ne:[^\]]*\]\s*/gi,'').replace(/^\s*#{1,6}\s*/gm,'').replace(/\*\*/g,'')); if(l.keyArticles?.length) pdf.moveDown().fontSize(9).text(`Références du module : ${l.keyArticles.join(', ')}`);}); }
    pdf.end();
  }));
  router.get('/legal/:id/document',wrap(async (req,res) => {
    const d=LEGAL_DOCS.find(d=>d.id===req.params.id); if(!d) throw fail(404,'Document introuvable.');
    const {default:PDFDocument}=await import('pdfkit'); const pdf=new PDFDocument({margin:48}); res.type('application/pdf').set('Content-Disposition',`attachment; filename="extraits-${d.id}.pdf"`); pdf.pipe(res); pdf.fontSize(20).text(d.title).moveDown().fontSize(11).text('Extraits pédagogiques indexés dans Academia — ne remplace pas le texte officiel intégral.').moveDown().text(d.summary || ''); (d.articles || []).forEach(a=>pdf.moveDown().fontSize(14).text(`${a.number} — ${a.title}`).fontSize(11).text(a.content)); pdf.end();
  }));
  router.get('/capabilities',(_req,res)=>res.json({whatsappDelivery:false,smsDelivery:false,webPush:false,voiceInput:true,certificate:'pedagogical',offline:'downloaded-documents'}));
  router.use((error:any,_req:any,res:any,_next:any)=> { if(res.headersSent) return res.end(); if(!error.status || error.status>=500) console.error('[Operations]',error.status || 'unavailable'); res.status(error.status || 503).json({error:error.status ? error.message : 'Service indisponible. Aucune réussite ni sauvegarde n’a été confirmée. Réessayez.'}); });
  return router;
}
export const operationsRouter=createOperationsRouter();
