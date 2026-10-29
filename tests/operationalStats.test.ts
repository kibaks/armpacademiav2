import {test} from 'node:test';
import assert from 'node:assert/strict';
import {operationalAnalytics,gradeCourse,learnerCourse,courseActivity,teaches} from '../shared/operationalStats';
import {computeUserLearningStats} from '../src/utils/learningStats';
import {buildCourseCatalog} from '../shared/courseCatalog';
const course=buildCourseCatalog()[0];
const p:any={id:'learner',role:'particulier',institution:'ARMP',name:'Esther',completedModulesCount:0,certificationsCount:0,offlineDownloads:[]};
test('new learners have no invented hours, score, readings or certifications',()=>{
 const stats=computeUserLearningStats(p,[course]);
 assert.equal(stats.averageScore,0);assert.equal(stats.totalStudyHours,0);assert.equal(stats.streakDays,0);assert.deepEqual(stats.recentReadEntries,[]);assert.equal(stats.lastLearningCourse,null);
 const row=learnerCourse(p,course);assert.equal(row.progressPct,0);assert.equal(row.quizScore,0);assert.equal(row.completedLessonsCount,0);assert.equal(row.isCertified,false);assert.equal(row.studyTime,'0 min');
});
test('zero score stays zero, reading alone cannot create a certification',()=>{
 const row=learnerCourse({...p,courseProgress:{[course.id]:100},quizScoresByCourse:{[course.id]:0}},course);
 assert.equal(row.quizScore,0);assert.equal(row.isCertified,false);
});
test('institutional totals use real profiles and actual filters without multipliers',()=>{
 const ps=[{...p,joinDate:'2026-10-10T12:00:00Z',lastReadAt:'2026-10-20T00:00:00Z',quizScoresByCourse:{[course.id]:80},totalStudyMinutes:60,studyMinutesByDay:{'2026-10-20':30}}, {...p,id:'other',institution:'DGCMP',joinDate:'2026-05-01T00:00:00Z'}, {...p,id:'admin',role:'super_admin'}];
 const all=operationalAnalytics(ps,[course],[],'Toutes les périodes');assert.equal(all.totalLearners,2);assert.equal(all.hoursDelivered,1);
 const q=operationalAnalytics(ps,[course],[],'Trimestre 4 - 2026','ARMP');assert.equal(q.totalLearners,1);assert.equal(q.hoursDelivered,0.5);assert.equal(q.globalPassRate,100);assert.equal(q.monthlySeries.length,3);assert.equal(q.monthlySeries[0].learners,1);
 const empty=operationalAnalytics([],[],[],'Toutes les périodes');assert.equal(empty.totalLearners,0);assert.equal(empty.globalPassRate,0);assert.equal(empty.hoursDelivered,0);
 assert.throws(()=>operationalAnalytics([],[],[],'invented'));
});
test('module scope and enrollments depend on recorded IDs, not names or arbitrary assignment',()=>{
 assert.equal(teaches({...p,role:'formateur',name:'Sylvie'},course),false);
 assert.equal(teaches({...p,role:'formateur',registeredCourseIds:[course.id]},course),true);
 assert.equal(courseActivity(p,course),false);assert.equal(courseActivity({...p,registeredCourseIds:[course.id]},course),true);
});
test('grading rejects incomplete or forged values and computes the real score',()=>{
 assert.throws(()=>gradeCourse(course,[]));assert.throws(()=>gradeCourse(course,course.quiz.map(()=>99)));
 const pass=gradeCourse(course,course.quiz.map(q=>q.correctIndex));assert.equal(pass.score,100);assert.equal(pass.passed,true);
 const fail=gradeCourse(course,course.quiz.map(q=>(q.correctIndex+1)%q.options.length));assert.equal(fail.score,0);assert.equal(fail.passed,false);
});
