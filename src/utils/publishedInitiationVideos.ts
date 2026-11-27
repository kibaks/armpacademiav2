import videos from '../data/publishedInitiationVideos.json';
/** Exact source matching prevents serving an obsolete lesson after edits. */
export function publishedInitiationVideo(courseId:string, lessonIndex:number, content:string) {
  const video = (videos as {courseId:string;lessonIndex:number;content:string;url:string}[]).find(item=>item.courseId===courseId && item.lessonIndex===lessonIndex && item.content===content);
  return video?.url;
}
