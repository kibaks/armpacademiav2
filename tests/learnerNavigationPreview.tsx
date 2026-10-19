import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../src/index.css';
import {Header} from '../src/components/Header';
import {InitiationPathway} from '../src/components/InitiationPathway';
import {CourseCatalog} from '../src/components/CourseCatalog';
import {COURSES_DATA} from '../src/data/coursesData';
import {getLearnerOnboarding} from '../src/utils/learnerOnboarding';
import type {UserProfile} from '../src/types';
const profile={id:'preview-learner',name:'Chantal Kabeya',role:'pme',roleTitle:'Apprenante PME',email:'demo@example.invalid',institution:'Compte de prévisualisation',level:'Débutant',niveauValidation:'Initiation',certificationsCount:0,completedModulesCount:0,offlineDownloads:[],completedLessonsByCourse:{},avatarUrl:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#0c3b7c"/><text x="32" y="40" text-anchor="middle" font-size="25" fill="white">CK</text></svg>')} as UserProfile;
function Preview(){
 const [tab,setTab]=useState('initiation'),[dark,setDark]=useState(false),[offline,setOffline]=useState(false),[notice,setNotice]=useState('');
 const state=getLearnerOnboarding(profile,COURSES_DATA);
 return <div className="min-h-screen bg-slate-100 text-slate-900">
 <div className="bg-amber-100 p-2 text-center text-xs">Prévisualisation de navigation · Compte fictif, sans connexion serveur</div>
 <Header isAuthenticated onOpenLogin={()=>{}} onLogout={()=>setNotice('Déconnexion sélectionnée')} currentProfile={profile} allProfiles={{pme:profile}} onSelectRole={()=>{}} activeTab={tab} setActiveTab={setTab} isDarkMode={dark} setIsDarkMode={setDark} isOfflineMode={offline} setIsOfflineMode={setOffline} courses={COURSES_DATA} initiationRequired onOpenInitiation={()=>setTab('initiation')} onNavigateProfileTab={()=>setTab('profil')} onOpenCourse={course=>setNotice(state.required&&!state.modules.some(m=>m.id===course.id)?'Module avancé verrouillé':'Cours d’initiation sélectionné')} />
 {notice&&<p role="status">{notice}</p>}
 <main className="max-w-7xl mx-auto p-4">
 {tab==='initiation'?<InitiationPathway showHeader={false} onReturnPortal={()=>setTab('accueil')} modules={state.modules} isRead={state.isRead} ready={state.readyForTest} onOpen={()=>setNotice('Cours d’initiation sélectionné')} onTest={()=>setNotice('Test de niveau demandé')} onTutor={()=>{}} onLogout={()=>{}} />
 :tab==='catalogue'?<CourseCatalog courses={COURSES_DATA} currentProfile={profile} isAuthenticated onOpenCoursePlayer={course=>setNotice('Lecture autorisée : '+course.id)} onOpenInitiation={()=>{setTab('initiation');setNotice('Reprenez l’initiation et réussissez le test de niveau.');}} onOpenCgpmpRequestForm={()=>{}} onToggleOfflineDownload={()=>{}} isOfflineMode={false} />
 :tab==='profil'?<><h1>Profil de Chantal Kabeya</h1><button onClick={()=>setTab('initiation')}>Mon initiation</button></>
 :<><h1 className="text-2xl font-bold">Portail ARMP Academia</h1><p className="my-4">Les modules avancés restent conditionnés au test de niveau.</p><button className="bg-blue-900 text-white rounded-xl p-3 mr-3" onClick={()=>setTab('catalogue')}>Voir les modules</button><button onClick={()=>setTab('initiation')}>Mon initiation</button></>}
 </main></div>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
