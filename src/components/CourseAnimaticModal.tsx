import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Lock,
  Send,
  Film,
  Scale,
  Award,
} from 'lucide-react';
import { CourseModule, UserProfile } from '../types';
import { AnimatedLessonPlayer } from './AnimatedLessonPlayer';
import { speechService } from '../utils/speechService';

interface CourseAnimaticModalProps {
  course: CourseModule | null;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  currentProfile: UserProfile;
  onRequireAuth?: (course: CourseModule) => void;
  onStartLearning?: (course: CourseModule) => void;
  onRequestCgpmp?: (course: CourseModule) => void;
}

export const CourseAnimaticModal: React.FC<CourseAnimaticModalProps> = ({
  course,
  isOpen,
  onClose,
  isAuthenticated = false,
  currentProfile,
  onRequireAuth,
  onStartLearning,
  onRequestCgpmp,
}) => {
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);

  const needsDfat = course ? course.requiresDfatApproval && currentProfile.role === 'cgpmp_member' : false;

  const handleClose = useCallback(() => {
    speechService.stop();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedLessonIndex(0);
    } else {
      speechService.stop();
    }
  }, [isOpen, course?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  if (!isOpen || !course) return null;

  const currentLesson = course.lessons[selectedLessonIndex] || course.lessons[0] || {
    id: 'preview-1',
    title: course.title,
    duration: course.duration,
    content: course.description,
    keyArticles: [course.legalRef],
    format: 'animation' as const,
    templateId: 'whiteboard',
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <button
        onClick={handleClose}
        className="absolute inset-0 w-full h-full cursor-default"
        aria-label="Fermer"
      />

      <div
        className="relative w-full max-w-6xl xl:max-w-7xl max-h-[94vh] bg-slate-900 rounded-3xl overflow-y-auto shadow-2xl border border-white/15 flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shrink-0">
              <Film className="w-3.5 h-3.5" /> STUDIO PÉDAGOGIQUE D’AÏSHA • DICTION POSÉE
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/30 border border-blue-400/30 text-blue-300 text-[11px] font-bold shrink-0">
              {course.code}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white truncate">
              {course.title}
            </h3>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-white/10 transition shrink-0"
            aria-label="Fermer le film"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter selector bar */}
        {course.lessons.length > 1 && (
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Chapitre :
            </span>
            {course.lessons.map((les, idx) => (
              <button
                key={les.id || idx}
                onClick={() => setSelectedLessonIndex(idx)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition shrink-0 flex items-center gap-1.5 ${
                  selectedLessonIndex === idx
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/30 text-[10px] flex items-center justify-center font-black">
                  {idx + 1}
                </span>
                <span className="max-w-[160px] truncate">{les.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* Continuous 2D Cartoon Film Player */}
        <div className="p-3 sm:p-4 bg-slate-950">
          <AnimatedLessonPlayer
            course={course}
            lesson={currentLesson}
            lessonIndex={selectedLessonIndex}
            currentProfile={currentProfile}
          />
        </div>

        {/* Bottom CTA Footer */}
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
              <Scale className="w-3.5 h-3.5" /> {course.legalRef}
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <Award className="w-3.5 h-3.5" /> Certifiant ARMP ({course.duration})
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  handleClose();
                  if (needsDfat) {
                    onRequestCgpmp?.(course);
                  } else {
                    onRequireAuth?.(course);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {needsDfat ? (
                  <>
                    <Send className="w-4 h-4" /> Demander via CGPMP
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Se connecter pour suivre le cours complet
                  </>
                )}
              </button>
            ) : needsDfat ? (
              <button
                onClick={() => {
                  handleClose();
                  onRequestCgpmp?.(course);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Soumettre requête CGPMP
              </button>
            ) : (
              <button
                onClick={() => {
                  handleClose();
                  onStartLearning?.(course);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Ouvrir le module complet & Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
