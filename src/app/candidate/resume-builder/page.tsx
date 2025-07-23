// src/app/candidate/resume-builder/page.tsx
'use client'; // This must be the very first line

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toast, Toaster } from 'sonner';
// Removed Undo2, Redo2 from lucide-react import
import { FileText, Download, Eye, Sparkles, User, Briefcase, GraduationCap, Award, Upload, X, Mic, BookOpen, FolderGit2, Palette, StopCircle, UploadCloud, Copy, Trash2, Bold, Italic, List, ListOrdered, Link as LinkIcon, Unlink } from 'lucide-react'; // Removed Undo2, Redo2 icons
import { useEditor, EditorContent, Editor } from '@tiptap/react'; // TipTap imports
import StarterKit from '@tiptap/starter-kit'; // TipTap StarterKit
import LinkExtension from '@tiptap/extension-link'; // TipTap Link Extension
import Placeholder from '@tiptap/extension-placeholder'; // Corrected: TipTap Placeholder Extension

// REMOVED: import 'react-quill/dist/quill.snow.css'; // This CSS is no longer needed.

import CandidateLayout from '@/components/layout/CandidateLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// --- Type Definitions ---
export interface PersonalInfo { name: string; email: string; phone: string; location: string; legalStatus: string; }
export interface ExperienceEntry { id: string; jobTitle: string; company: string; dates: string; description: string; }
export interface EducationEntry { id: string; degree: string; institution: string; graduationYear: string; gpa: string; achievements: string; }
export interface SkillCategory { id: string; category: string; skills_list: string; }
export interface CertificationEntry { id: string; name: string; issuer: string; date: string; }
export interface PublicationEntry { id: string; title: string; authors: string; journal: string; date: string; link: string; }
export interface ProjectEntry { id: string; title: string; date: string; description: string; }
export interface ResumeData { personal: PersonalInfo; summary:string; experience: ExperienceEntry[]; education: EducationEntry[]; skills: SkillCategory[]; certifications: CertificationEntry[]; publications: PublicationEntry[]; projects: ProjectEntry[]; }
type EnhancementContext = | { section: 'summary' } | { section: 'experience'; index: number } | { section: 'education'; index: number } | { section: 'projects'; index: number };
export interface StyleOptions { fontFamily: string; fontSize: number; accentColor: string; }

// --- useHistory Hook (Simplified - removed undo/redo functionality) ---
const useHistory = (initialState: any) => {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = (action: any, overwrite = false) => {
        const newState = typeof action === 'function' ? action(history[currentIndex]) : action;
        if (!overwrite && JSON.stringify(newState) === JSON.stringify(history[currentIndex])) return;
        const newHistory = history.slice(0, currentIndex + 1);
        setHistory([...newHistory, newState]);
        setCurrentIndex(newHistory.length);
    };

    // Undo/Redo functionality removed from here
    return { state: history[currentIndex], setState, undo: () => {}, redo: () => {}, canUndo: false, canRedo: false };
};

// --- UI Primitive Components ---
const Card = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (<div className="bg-white shadow-lg rounded-lg border" {...props}>{children}</div>);
const CardHeader = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (<div className="p-6" {...props}>{children}</div>);
const CardTitle = ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (<h3 className="text-xl font-semibold text-gray-800" {...props}>{children}</h3>);
const CardContent = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (<div className="p-6 pt-0" {...props}>{children}</div>);
const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'destructive', size?: 'default' | 'sm', as?: React.ElementType }>(({ children, variant, size, className, as: Component = 'button', ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none";
    const variantStyles = { default: "bg-indigo-600 text-white hover:bg-indigo-700", outline: "border border-gray-300 bg-transparent hover:bg-gray-100", destructive: "bg-red-600 text-white hover:bg-red-700" };
    const sizeStyles = { default: "h-10 py-2 px-4", sm: "h-9 px-3" };
    return <Component ref={ref} className={`${baseStyle} ${variantStyles[variant || 'default']} ${sizeStyles[size || 'default']} ${className}`} {...props}>{children}</Component>;
});
Button.displayName = 'Button'; // Add display name for forwardRef

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (<input {...props} className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium" />);
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (<select {...props} className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm">{children}</select>);
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => (<label {...props} className="text-sm font-medium leading-none block mb-1" />);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => ( <textarea {...props} className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm" />);
// Removed editorModules as ReactQuill is gone
// const editorModules = { toolbar: [[{ 'font': [] }], [{ 'size': ['small', false, 'large', 'huge'] }], ['bold', 'italic', 'underline', 'strike'], [{ 'color': [] }, { 'background': [] }], [{ 'script': 'sub'}, { 'script': 'super' }], ['blockquote'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], [{ 'indent': '-1'}, { 'indent': '+1' }], [{ 'align': [] }], ['link', 'clean']] };

// --- Refactored Form Section Components ---
const PersonalForm = ({ data, onChange, onPicChange, onPicRemove, picPreview }: any) => (
    <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Full Name</Label><Input value={data.name || ''} onChange={e => onChange('name', e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={data.email || ''} onChange={e => onChange('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={data.phone || ''} onChange={e => onChange('phone', e.target.value)} /></div>
            <div><Label>Location</Label><Input value={data.location || ''} onChange={e => onChange('location', e.target.value)} /></div>
        </div>
        <div><Label>Legal Status</Label><Select value={data.legalStatus || 'Prefer not to say'} onChange={e => onChange('legalStatus', e.target.value)}><option>Prefer not to say</option><option>U.S. Citizen</option></Select></div>
        <div>
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
                <Input type="file" accept="image/png, image/jpeg" onChange={onPicChange} className="flex-1"/>
                {picPreview && (
                    <div className="relative">
                        <img src={picPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"/>
                        <Button variant="destructive" size="sm" className="absolute -top-1 -right-1 rounded-full p-1 h-auto" onClick={onPicRemove}><X size={12}/></Button>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const SummaryForm = ({ value, onChange, onEnhance, loading }: any) => (
    <div>
        <Label>Professional Summary</Label>
        {/* Changed to Textarea */}
        <Textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
            rows={5}
        />
        <Button size="sm" variant="outline" className="mt-2" onClick={onEnhance} disabled={loading}><Sparkles size={14} className="mr-1.5" />Enhance</Button>
    </div>
);

const DynamicSection = ({ sectionKey, data, onChange, onAdd, onRemove, onEnhance, fields, addPayload, loading }: any) => (
    <div className="space-y-4">
        {(data || []).map((item: any, index: number) => ( // Ensure data is an array
            <div key={item.id} className="p-4 border rounded-lg relative space-y-3">
                 <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => onRemove(sectionKey, item.id)}><Trash2 size={14} /></Button>
                 <div className="grid md:grid-cols-2 gap-4">
                    {fields.slice(0, 4).map((field: any) => (
                        <div key={field.key} className={field.colSpan === 2 ? 'md:col-span-2' : ''}>
                           <Label>{field.label}</Label>
                           {/* Conditionally render Input or Textarea */}
                           {field.type === 'quill' ? ( // Changed to Textarea
                               <Textarea
                                   value={item[field.key] || ''}
                                   onChange={e => onChange(sectionKey, index, field.key, e.target.value)}
                                   className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
                                   rows={3}
                               />
                           ) : (
                               <Input value={item[field.key] || ''} onChange={e => onChange(sectionKey, index, field.key, e.target.value)} />
                           )}
                        </div>
                    ))}
                 </div>
                 {fields.slice(4).map((field: any) => (
                    <div key={field.key}>
                        <Label>{field.label}</Label>
                        {field.type === 'textarea' || field.type === 'quill' ? ( // Both textarea and quill types use Textarea
                             <Textarea
                                value={item[field.key] || ''}
                                onChange={e => onChange(sectionKey, index, field.key, e.target.value)}
                                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
                                rows={3}
                             />
                        ) : (
                            <Input value={item[field.key] || ''} onChange={e => onChange(sectionKey, index, field.key, e.target.value)} />
                        )}
                        {field.enhance && (
                             <Button size="sm" variant="outline" className="mt-2" onClick={() => onEnhance({ section: sectionKey, index })} disabled={loading}><Sparkles size={14} className="mr-1.5" />Enhance</Button>
                        )}
                    </div>
                 ))}
            </div>
        ))}
        <Button variant="outline" onClick={() => onAdd(sectionKey, addPayload)}>+ Add {sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}</Button>
    </div>
);

// Removed TipTap Editor Wrapper Component
// const TiptapEditor = ({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) => { /* ... */ };


const DesignForm = ({ options, onChange }: { options: StyleOptions, onChange: (field: keyof StyleOptions, value: any) => void }) => {
    const fontFamilies = ['Calibri, sans-serif', 'Georgia, serif', 'Helvetica, sans-serif', 'Verdana, sans-serif', 'Garamond, serif'];
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="font-family">Font Family</Label>
                <Select id="font-family" value={options.fontFamily} onChange={e => onChange('fontFamily', e.target.value)}>
                    {fontFamilies.map(font => <option key={font} value={font}>{font.split(',')[0]}</option>)}
                </Select>
            </div>
             <div>
                <Label htmlFor="font-size">Font Size (pt)</Label>
                <Input id="font-size" type="number" value={options.fontSize} onChange={e => onChange('fontSize', parseInt(e.target.value, 10))} />
            </div>
             <div>
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex items-center gap-2">
                    <Input id="accent-color" type="color" value={options.accentColor} onChange={e => onChange('accentColor', e.target.value)} className="p-1 h-10 w-14" />
                    <Input type="text" value={options.accentColor} onChange={e => onChange('accentColor', e.target.value)} className="flex-1"/>
                </div>
            </div>
        </div>
    );
};

// --- Refactored Modal Components ---
const EnhancementModal = ({ isOpen, versions, selected, onSelect, onApply, onClose, originalText }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Choose an Enhanced Version</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {versions.map((version: string, index: number) => (
                        <div key={index} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => onSelect(version)}>
                            <label className="flex items-start space-x-3">
                                <input type="radio" name="enhancementVersion" checked={selected === version} onChange={() => onSelect(version)} className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                                <span className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: version === originalText ? `<strong>(Original)</strong> ${version}` : version }} />
                            </label>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onApply}>Apply Selection</Button>
                </div>
            </div>
        </div>
    );
};

const PitchModal = ({ isOpen, onClose, pitchText, setPitchText, startRecording, stopRecording, isRecording, recordedVideoUrl, videoRef, onVideoFileChange, onUpload, loading, videoBlob }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-gray-800">Your Elevator Pitch</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button></div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">AI-Generated Script</h4>
                        <Textarea value={pitchText} onChange={e => setPitchText(e.target.value)} rows={12} className="bg-gray-50 w-full" />
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => { navigator.clipboard.writeText(pitchText); toast.success("Copied to clipboard!"); }}><Copy size={14} className="mr-2" />Copy Script</Button>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Record or Upload Video</h4>
                        <div className="bg-black rounded-lg aspect-video mb-2 flex items-center justify-center">
                            <video ref={videoRef} src={!isRecording && recordedVideoUrl ? recordedVideoUrl : undefined} controls={!!recordedVideoUrl && !isRecording} className="w-full h-full rounded-lg object-contain bg-black" autoPlay={isRecording} muted={isRecording}></video>
                        </div>
                        <div className="flex justify-center items-center gap-4">
                            {isRecording ? (<Button onClick={stopRecording} variant="destructive"><StopCircle size={16} className="mr-2" />Stop</Button>) : (<Button onClick={startRecording}><Mic size={16} className="mr-2" />Record</Button>)}
                            <Label htmlFor="video-upload" className="cursor-pointer m-0"><Button as="span" variant="outline"><UploadCloud size={16} className="mr-2" />Upload File</Button></Label>
                            <Input id="video-upload" type="file" accept="video/*" className="hidden" onChange={onVideoFileChange} />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={onUpload} disabled={!videoBlob || loading}>{loading ? "Uploading..." : <><Upload size={16} className="mr-2" /> Upload Pitch</>}</Button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function ResumeBuilder() {
    const [activeSection, setActiveSection] = useState<string>('personal');
    const { state: resumeData, setState: setResumeDataState, undo, redo, canUndo, canRedo } = useHistory({
        personal: { name: '', email: '', phone: '', location: '', legalStatus: 'Prefer not to say' },
        summary: '',
        experience: [{ id: crypto.randomUUID(), jobTitle: '', company: '', dates: '', description: '' }],
        education: [{ id: crypto.randomUUID(), degree: '', institution: '', graduationYear: '', gpa: '', achievements: '' }],
        skills: [{ id: crypto.randomUUID(), category: '', skills_list: '' }],
        certifications: [{ id: crypto.randomUUID(), name: '', issuer: '', date: '' }],
        publications: [{ id: crypto.randomUUID(), title: '', authors: '', journal: '', date: '', link: '' }],
        projects: [{ id: crypto.randomUUID(), title: '', date: '', description: '' }]
    });

    const setResumeData = (action: any, overwrite = false) => setResumeDataState(action, overwrite);

    const [loading, setLoading] = useState<boolean>(false);
    const [profilePic, setProfilePic] = useState<{ preview: string; file: File | null }>({ preview: '', file: null });
    const [showPamtenLogo, setShowPamtenLogo] = useState<boolean>(false);
    const [showEnhancementModal, setShowEnhancementModal] = useState<boolean>(false);
    const [enhancementVersions, setEnhancementVersions] = useState<string[]>([]);
    const [selectedEnhancement, setSelectedEnhancement] = useState<string>('');
    const [originalText, setOriginalText] = useState<string>('');
    const [enhancementContext, setEnhancementContext] = useState<EnhancementContext | null>(null);
    const [showPitchModal, setShowPitchModal] = useState<boolean>(false);
    const [pitchText, setPitchText] = useState('');
    const [styleOptions, setStyleOptions] = useState<StyleOptions>({ fontFamily: 'Calibri, sans-serif', fontSize: 11, accentColor: '#34495e' });
    const [panelWidth, setPanelWidth] = useState(50);
    const isResizing = useRef(false);
    const API_BASE_URL: string = 'http://127.0.0.1:5000/api';

    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const handlePersonalChange = (field: keyof PersonalInfo, value: string) => { setResumeData((prev: ResumeData) => ({ ...prev, personal: { ...prev.personal, [field]: value } }), true); };
    const handleSummaryChange = (value: string) => { setResumeData((prev: ResumeData) => ({...prev, summary: value}), true); };
    const handleDynamicChange = <T extends ExperienceEntry | EducationEntry | SkillCategory | CertificationEntry | PublicationEntry | ProjectEntry>(section: keyof ResumeData, index: number, field: keyof T, value: any) => {
        setResumeData((prev: ResumeData) => {
            const newList = [...(prev[section] as T[])];
            newList[index] = { ...newList[index], [field]: value };
            return { ...prev, [section]: newList };
        }, true);
    };

    const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            const file = event.target.files[0];
            setProfilePic({ preview: URL.createObjectURL(file), file });
            toast.success("Profile picture selected.");
        }
    };
    
    const handleProfilePicRemove = () => {
        if(profilePic.preview) { URL.revokeObjectURL(profilePic.preview); }
        setProfilePic({ preview: '', file: null });
        toast.info("Profile picture removed.");
    };

    const handleStyleChange = (field: keyof StyleOptions, value: any) => {
        setStyleOptions(prev => ({...prev, [field]: value}));
    };

    const addDynamicEntry = (section: keyof ResumeData, newEntry: any) => setResumeData((prev: ResumeData) => ({ ...prev, [section]: [...(prev[section] as any[]), { ...newEntry, id: crypto.randomUUID() }] }), true);
    const removeDynamicEntry = (section: keyof ResumeData, id: string) => setResumeData((prev: ResumeData) => ({ ...prev, [section]: (prev[section] as any[]).filter(item => item.id !== id) }), true);
    const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); isResizing.current = true; document.body.style.cursor = 'col-resize'; };
    const handleMouseUp = useCallback(() => { isResizing.current = false; document.body.style.cursor = 'default'; }, []);
    const handleMouseMove = useCallback((e: MouseEvent) => { if (!isResizing.current) return; const newWidth = (e.clientX / window.innerWidth) * 100; if (newWidth > 25 && newWidth < 75) { setPanelWidth(newWidth); } }, []);
    useEffect(() => { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [handleMouseMove, handleMouseUp]);
    const stripHtml = (html: string | undefined) => { const doc = new DOMParser().parseFromString(html || '', 'text/html'); return doc.body.textContent || ""; };

    // --- Data Normalization Function (Updated) ---
    const normalizeResumeData = (data: any): ResumeData => {
        const defaultResume: ResumeData = {
            personal: { name: '', email: '', phone: '', location: '', legalStatus: 'Prefer not to say' },
            summary: '',
            experience: [],
            education: [],
            skills: [],
            certifications: [],
            publications: [],
            projects: []
        };

        const normalized = { ...defaultResume, ...data };

        // Ensure arrays are initialized if missing or not arrays
        normalized.experience = Array.isArray(normalized.experience) ? normalized.experience : [];
        normalized.education = Array.isArray(normalized.education) ? normalized.education : [];
        normalized.skills = Array.isArray(normalized.skills) ? normalized.skills : [];
        normalized.certifications = Array.isArray(normalized.certifications) ? normalized.certifications : [];
        normalized.publications = Array.isArray(normalized.publications) ? normalized.publications : [];
        normalized.projects = Array.isArray(normalized.projects) ? normalized.projects : [];

        // Ensure summary is a string
        normalized.summary = typeof normalized.summary === 'string' ? normalized.summary : '';

        // Ensure personal fields are strings and handle potential null/undefined
        if (normalized.personal) {
            normalized.personal.name = typeof normalized.personal.name === 'string' ? normalized.personal.name : '';
            normalized.personal.email = typeof normalized.personal.email === 'string' ? normalized.personal.email : '';
            normalized.personal.phone = typeof normalized.personal.phone === 'string' ? normalized.personal.phone : '';
            normalized.personal.location = typeof normalized.personal.location === 'string' ? normalized.personal.location : '';
            normalized.personal.legalStatus = typeof normalized.personal.legalStatus === 'string' ? normalized.personal.legalStatus : 'Prefer not to say';
        } else {
            normalized.personal = defaultResume.personal;
        }

        // Ensure IDs and default values for dynamic sections, specifically checking 'title' for projects
        normalized.experience = normalized.experience.map( (item: any) => ({
            id: item.id || crypto.randomUUID(),
            jobTitle: typeof item.jobTitle === 'string' ? item.jobTitle : '',
            company: typeof item.company === 'string' ? item.company : '',
            dates: typeof item.dates === 'string' ? item.dates : '',
            description: typeof item.description === 'string' ? item.description : ''
        }));
        normalized.education = normalized.education.map( (item: any) => ({
            id: item.id || crypto.randomUUID(),
            degree: typeof item.degree === 'string' ? item.degree : '',
            institution: typeof item.institution === 'string' ? item.institution : '',
            graduationYear: typeof item.graduationYear === 'string' ? item.graduationYear : '',
            gpa: typeof item.gpa === 'string' ? item.gpa : '',
            achievements: typeof item.achievements === 'string' ? item.achievements : ''
        }));
        normalized.skills = normalized.skills.map( (item: any) => ({
            id: item.id || crypto.randomUUID(),
            category: typeof item.category === 'string' ? item.category : '',
            skills_list: typeof item.skills_list === 'string' ? item.skills_list : '',
        }));
        normalized.projects = normalized.projects.map( (item: any) => ({
            id: item.id || crypto.randomUUID(),
            title: typeof item.title === 'string' ? item.title : '', // Explicitly check for title
            date: typeof item.date === 'string' ? item.date : '',
            description: typeof item.description === 'string' ? item.description : '',
        }));
        normalized.publications = normalized.publications.map( (item: any) => ({
            id: item.id || crypto.randomUUID(),
            title: typeof item.title === 'string' ? item.title : '',
            authors: typeof item.authors === 'string' ? item.authors : '',
            journal: typeof item.journal === 'string' ? item.journal : '',
            date: typeof item.date === 'string' ? item.date : '',
            link: typeof item.link === 'string' ? item.link : '',
        }));
        normalized.certifications = normalized.certifications.map( (item: any) => ({
            id: item.id || crypto.randomUUID(),
            name: typeof item.name === 'string' ? item.name : '',
            issuer: typeof item.issuer === 'string' ? item.issuer : '',
            date: typeof item.date === 'string' ? item.date : '',
        }));

        return normalized;
    };


    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const toastId = "upload";
        toast.info("Parsing resume...", { id: toastId });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/parse-resume`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
            const result = await response.json();

            // Normalize the incoming data before setting the state
            const normalizedData = normalizeResumeData(result.parsedData); // Apply normalization
            setResumeDataState(normalizedData, true); // Use setResumeDataState from useHistory
            toast.success("Resume parsed successfully!", { id: toastId });
        } catch (error: any) {
            toast.error(`Failed to parse: ${error.message}`, { id: toastId });
            console.error("Frontend file upload error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnhance = async (context: EnhancementContext) => {
        let textToEnhance: string = ''; let sectionNameForApi: string = '';
        if (context.section === 'summary') { textToEnhance = resumeData.summary; sectionNameForApi = 'Summary'; } 
        else if (context.section === 'experience') { textToEnhance = resumeData.experience[context.index].description; sectionNameForApi = 'Experience Description';} 
        else if (context.section === 'education') { textToEnhance = resumeData.education[context.index].achievements; sectionNameForApi = 'Education Achievements'; } 
        else if (context.section === 'projects') { textToEnhance = resumeData.projects[context.index].description; sectionNameForApi = 'Project Description';}
        if (!textToEnhance || !stripHtml(textToEnhance).trim()) { toast.info("Field is empty, nothing to enhance."); return; }
        setEnhancementContext(context); setOriginalText(textToEnhance); setLoading(true); toast.info(`Enhancing ${sectionNameForApi}...`);
        try {
            const response = await fetch(`${API_BASE_URL}/enhance-section`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sectionName: sectionNameForApi, textToEnhance }) });
            if (!response.ok) throw new Error('Enhancement failed');
            const result = await response.json();
            if (Array.isArray(result.enhancedVersions) && result.enhancedVersions.length > 0) {
                setEnhancementVersions([textToEnhance, ...result.enhancedVersions]);
                setSelectedEnhancement(textToEnhance);
                setShowEnhancementModal(true);
                toast.success("AI suggestions ready!");
            } else { toast.info("No new suggestions were generated."); }
        } catch (error: any) { toast.error(error.message); } finally { setLoading(false); }
    };

    const handleApplyEnhancement = () => {
        if (!enhancementContext) return;
        const { section } = enhancementContext;
        if (section === 'summary') { handleSummaryChange(selectedEnhancement); } 
        else if ('index' in enhancementContext) {
            if (section === 'experience') { handleDynamicChange('experience', enhancementContext.index, 'description', selectedEnhancement); } 
            else if (section === 'education') { handleDynamicChange('education', enhancementContext.index, 'achievements', selectedEnhancement); }
            else if (section === 'projects') { handleDynamicChange('projects', enhancementContext.index, 'description', selectedEnhancement); }
        }
        setShowEnhancementModal(false); toast.success("Section updated!");
    };

    const handleGeneratePitch = async () => {
        setLoading(true); toast.info("Generating Elevator Pitch...", {id: 'pitch'});
        try {
            // Frontend call to new backend endpoint
            const response = await fetch(`${API_BASE_URL}/generate-elevator-pitch`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ resumeData }) });
            if (!response.ok) throw new Error('Failed to generate pitch');
            const result = await response.json();
            setPitchText(result.elevatorPitch);
            setShowPitchModal(true);
            toast.success("Elevator pitch generated!", {id: 'pitch'});
        } catch (error: any) { toast.error(error.message, {id: 'pitch'}); } finally { setLoading(false); }
    };

    // --- FULLY INTEGRATED VIDEO HANDLERS ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) { videoRef.current.srcObject = stream; }
            setIsRecording(true); setRecordedVideoUrl(null); setVideoBlob(null);
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) { chunks.push(event.data); } };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                setVideoBlob(blob);
                const url = URL.createObjectURL(blob);
                setRecordedVideoUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
        } catch (err) { toast.error("Could not access camera/microphone. Please check permissions."); console.error("Error starting recording:", err); }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') { mediaRecorderRef.current.stop(); }
        setIsRecording(false);
    };

    const handleVideoFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) { setVideoBlob(file); setRecordedVideoUrl(URL.createObjectURL(file)); toast.success("Video file selected."); }
    };

    const handleUploadPitchVideo = async () => {
        if (!videoBlob) { toast.error("No video to upload!"); return; }
        setLoading(true); toast.info("Uploading video pitch...", { id: 'upload-pitch' });
        console.log("Uploading video:", videoBlob);
        setTimeout(() => { setLoading(false); toast.success("Video pitch uploaded! (simulation)", { id: 'upload-pitch' }); }, 2000);
    };

    // --- FULLY INTEGRATED DOWNLOAD HANDLER ---
    const handleDownload = async (type: 'PDF' | 'DOCX') => {
        const endpoint = type === 'PDF' ? '/generate-pdf' : '/generate-docx';
        const filename = `${resumeData.personal.name.replace(/\s/g, '_')}_Resume.${type.toLowerCase()}`;
        const toastId = `${type.toLowerCase()}-download`;

        toast.info(`Generating ${type} file...`, { id: toastId, duration: 15000 });
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/generate-pdf`, { // Changed to always generate PDF for now
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...resumeData, styleOptions, showPamtenLogo })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server responded with an error');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success(`${type} downloaded successfully!`, { id: toastId });

        } catch (error: any) {
            toast.error(`Failed to generate ${type}: ${error.message}`, { id: toastId });
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    const renderResumePreview = () => {
        // Safely destructure personal, providing default empty object if undefined
        const { personal = {}, summary, experience, education, skills, certifications, publications, projects } = resumeData;
        // Safely access properties of personal, providing empty string defaults
        const contactDetails = [ 
            personal.name || '', // Added personal.name here
            personal.email || '', 
            personal.phone || '', 
            personal.location || '', 
            (personal.legalStatus && personal.legalStatus !== 'Prefer not to say') ? personal.legalStatus : null 
        ].filter(Boolean).join(' | ');

        return (
            <div id="resume-preview-content" className="bg-white shadow-lg rounded-lg p-8 border min-h-[600px] quill-content-container" style={{ fontFamily: styleOptions.fontFamily, fontSize: `${styleOptions.fontSize}pt`, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}> {/* Added whiteSpace: 'pre-wrap' */}
                {showPamtenLogo && (<div className="mb-4"><img src="https://placehold.co/120x32/white/purple?text=Pamten+Logo" alt="Pamten Logo" style={{ width: '120px' }} /></div>)}
                <div className="text-center mb-6 pb-4 border-b flex items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-bold" style={{color: styleOptions.accentColor}}>{personal.name || "Your Name"}</h2>
                        <p className="text-gray-600 mt-2">{contactDetails}</p>
                    </div>
                    {profilePic.preview && (<img src={profilePic.preview} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />)}
                </div>
                {/* Ensure unique keys for section headers and display content as plain text */}
                {/* Safely access summary before trimming */}
                {(summary || '').trim() && <div key="summary-section" className="mb-4"><h3 className="text-lg font-semibold border-b pb-1 mb-2" style={{color: styleOptions.accentColor}}>Summary</h3><div dangerouslySetInnerHTML={{__html: summary || ''}} /></div>}
                {/* Safely access arrays before calling .some() and their properties before .trim() */}
                {(experience || []).some(e => (e.jobTitle || '').trim() || (e.description || '').trim()) && <div key="experience-section" className="mb-4"><h3 className="text-lg font-semibold border-b pb-1 mb-2" style={{color: styleOptions.accentColor}}>Experience</h3>{(experience || []).map(exp => <div key={exp.id} className="mt-2"><h4><b>{exp.jobTitle || ''}</b></h4><p className="text-gray-500">{exp.company || ''} | {exp.dates || ''}</p><div dangerouslySetInnerHTML={{__html: exp.description || ''}} /></div>)}</div>}
                {(education || []).some(e => (e.degree || '').trim() || (e.achievements || '').trim()) && <div key="education-section" className="mb-4"><h3 className="text-lg font-semibold border-b pb-1 mb-2" style={{color: styleOptions.accentColor}}>Education</h3>{(education || []).map(edu => (<div key={edu.id} className="mt-2"><h4><b>{edu.degree || ''}</b>, {edu.institution || ''}</h4><p className="text-gray-500">{edu.graduationYear || ''}{edu.gpa && ` | GPA: ${edu.gpa}`}</p><div dangerouslySetInnerHTML={{__html: edu.achievements || ''}} /></div>))}</div>}
                {(skills || []).some(e => (e.category || '').trim() || (e.skills_list || '').trim()) && <div key="skills-section" className="mb-4"><h3 className="text-lg font-semibold border-b pb-1 mb-2" style={{color: styleOptions.accentColor}}>Skills</h3>{(skills || []).map(skill => <div key={skill.id} className="mt-1"><b>{skill.category || ''}:</b> <div dangerouslySetInnerHTML={{__html: skill.skills_list || ''}}/></div>)}</div>}
                {(projects || []).some(e => (e.title || '').trim() || (e.description || '').trim()) && <div key="projects-section" className="mb-4"><h3 className="text-lg font-semibold border-b pb-1 mb-2" style={{color: styleOptions.accentColor}}>Projects</h3>{(projects || []).map(proj => <div key={proj.id} className="mt-2"><h4><b>{proj.title || ''}</b> ({proj.date || ''})</h4><div dangerouslySetInnerHTML={{__html: proj.description || ''}}/></div>)}</div>}
                {(publications || []).some(e => (e.title || '').trim()) && <div key="publications-section" className="mb-4"><h3 className="text-lg font-semibold border-b pb-1 mb-2" style={{color: styleOptions.accentColor}}>Publications</h3>{(publications || []).map(pub => <div key={pub.id} className="mt-2"><h4><b>{pub.title || ''}</b> ({pub.date || ''})</h4><p className="text-sm text-gray-600">{pub.authors || ''} - <i>{pub.journal || ''}</i></p></div>)}</div>}
                {(certifications || []).some(e => (e.name || '').trim()) && <div><h3 key="certifications-section" className="text-lg font-semibold border-b pb-1 mb-2" style={{color: styleOptions.accentColor}}>Certifications</h3>{(certifications || []).map(cert => <div key={cert.id} className="mt-2"><h4><b>{cert.name || ''}</b></h4><p className="text-gray-500">{cert.issuer || ''} | {cert.date || ''}</p></div>)}</div>}
            </div>
        );
    };
    
    const sections = [ { id: 'personal', name: 'Personal', icon: <User size={16} /> }, { id: 'summary', name: 'Summary', icon: <FileText size={16} /> }, { id: 'experience', name: 'Experience', icon: <Briefcase size={16} /> }, { id: 'education', name: 'Education', icon: <GraduationCap size={16} /> }, { id: 'skills', name: 'Skills', icon: <Award size={16} /> }, { id: 'projects', name: 'Projects', icon: <FolderGit2 size={16} />}, { id: 'publications', name: 'Publications', icon: <BookOpen size={16} />}, { id: 'certifications', name: 'Certifications', icon: <Award size={16} /> }, { id: 'design', name: 'Design', icon: <Palette size={16}/> } ];

    return (
        <CandidateLayout>
            <Toaster richColors position="top-right" />
            <EnhancementModal isOpen={showEnhancementModal} versions={enhancementVersions} selected={selectedEnhancement} onSelect={setSelectedEnhancement} onApply={handleApplyEnhancement} onClose={() => setShowEnhancementModal(false)} originalText={originalText} />
            <PitchModal isOpen={showPitchModal} onClose={() => setShowPitchModal(false)} pitchText={pitchText} setPitchText={setPitchText} startRecording={startRecording} stopRecording={stopRecording} isRecording={isRecording} recordedVideoUrl={recordedVideoUrl} videoRef={videoRef} onVideoFileChange={handleVideoFileUpload} onUpload={handleUploadPitchVideo} loading={loading} videoBlob={videoBlob} />
            
            <div className="flex flex-col h-full bg-transparent font-sans">
                <header className="flex-shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 p-4">
                  <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                           <img src="https://placehold.co/32x32/white/purple?text=Logo" alt="Pamten Logo" className="h-8"/>
                           <div><h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">AI Resume Builder</h1><p className="text-xs text-gray-600 dark:text-gray-400">Craft your professional resume with AI assistance</p></div>
                      </div>
                      <div className="flex items-center gap-4">
                           {/* Removed undo and redo buttons */}
                           <Button onClick={handleGeneratePitch} disabled={loading} size="sm" variant="outline"><Mic size={14} className="mr-1.5"/>Elevator Pitch</Button>
                      </div>
                  </div>
                </header>

                <main className="flex flex-1 min-h-0">
                    <div className="flex flex-col overflow-y-auto p-6" style={{ width: `${panelWidth}%` }}>
                        <div className="space-y-6">
                            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload size={20} />Upload Resume</CardTitle></CardHeader><CardContent><Input type="file" accept=".pdf,.docx" onChange={handleFileUpload} disabled={loading} /></CardContent></Card>
                            <Card>
                                <CardContent className="p-4"><div className="flex flex-wrap gap-2">{sections.map(section => (<Button key={section.id} variant={activeSection === section.id ? "default" : "outline"} onClick={() => setActiveSection(section.id)} size="sm" className="flex items-center gap-2">{section.icon} {section.name}</Button>))}</div></CardContent>
                                <CardContent>
                                    {activeSection === 'personal' && <PersonalForm data={resumeData.personal} onChange={handlePersonalChange} onPicChange={handleProfilePicChange} onPicRemove={handleProfilePicRemove} picPreview={profilePic.preview} />}
                                    {activeSection === 'summary' && <SummaryForm value={resumeData.summary} onChange={handleSummaryChange} onEnhance={() => handleEnhance({ section: 'summary'})} loading={loading} />}
                                    {activeSection === 'experience' && <DynamicSection sectionKey="experience" data={resumeData.experience} onChange={handleDynamicChange} onAdd={addDynamicEntry} onRemove={removeDynamicEntry} onEnhance={handleEnhance} loading={loading} addPayload={{ jobTitle: '', company: '', dates: '', description: '' }} fields={[{key: 'jobTitle', label: 'Job Title'}, {key: 'company', label: 'Company'}, {key: 'dates', label: 'Dates', colSpan: 2}, {key: 'description', label: 'Description', type: 'textarea', enhance: true, colSpan: 2}]} />}
                                    {activeSection === 'education' && <DynamicSection sectionKey="education" data={resumeData.education} onChange={handleDynamicChange} onAdd={addDynamicEntry} onRemove={removeDynamicEntry} onEnhance={handleEnhance} loading={loading} addPayload={{ degree: '', institution: '', graduationYear: '', gpa: '', achievements: '' }} fields={[{key: 'degree', label: 'Degree'}, {key: 'institution', label: 'Institution'}, {key: 'graduationYear', label: 'Graduation Year'}, {key: 'gpa', label: 'GPA (Optional)'}, {key: 'achievements', label: 'Achievements & Coursework', type: 'textarea', enhance: true}]} />}
                                    {activeSection === 'skills' && <DynamicSection sectionKey="skills" data={resumeData.skills} onChange={handleDynamicChange} onAdd={addDynamicEntry} onRemove={removeDynamicEntry} loading={loading} addPayload={{ category: '', skills_list: '' }} fields={[{key: 'category', label: 'Category', colSpan: 2}, {key: 'skills_list', label: 'Skills (comma-separated)', type: 'textarea'}]} />}
                                    {activeSection === 'projects' && <DynamicSection sectionKey="projects" data={resumeData.projects} onChange={handleDynamicChange} onAdd={addDynamicEntry} onRemove={removeDynamicEntry} onEnhance={handleEnhance} loading={loading} addPayload={{ title: '', date: '', description: '' }} fields={[{key: 'title', label: 'Project Title'}, {key: 'date', label: 'Date'}, {key: 'description', label: 'Description', type: 'textarea', enhance: true, colSpan: 2}]} />}
                                    {activeSection === 'publications' && <DynamicSection sectionKey="publications" data={resumeData.publications} onChange={handleDynamicChange} onAdd={addDynamicEntry} onRemove={removeDynamicEntry} loading={loading} addPayload={{ title: '', authors: '', journal: '', date: '', link: '' }} fields={[{key: 'title', label: 'Publication Title', colSpan: 2}, {key: 'authors', label: 'Authors'}, {key: 'journal', label: 'Journal or Conference'}, {key: 'date', label: 'Publication Date'}, {key: 'link', label: 'Link (Optional)'}]} />}
                                    {activeSection === 'certifications' && <DynamicSection sectionKey="certifications" data={resumeData.certifications} onChange={handleDynamicChange} onAdd={addDynamicEntry} onRemove={removeDynamicEntry} loading={loading} addPayload={{ name: '', issuer: '', date: '' }} fields={[{key: 'name', label: 'Certification Name', colSpan: 2}, {key: 'issuer', label: 'Issuing Organization'}, {key: 'date', label: 'Date Received'}]} />}
                                    {activeSection === 'design' && <DesignForm options={styleOptions} onChange={handleStyleChange} />}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 w-2.5 cursor-col-resize bg-gray-200 hover:bg-indigo-200 transition-colors" onMouseDown={handleMouseDown}></div>

                    <div className="flex-1 flex flex-col overflow-y-auto p-6 min-w-0">
                       <Card className="flex-1 flex flex-col">
                           <CardHeader><CardTitle className="flex items-center gap-2"><Eye size={20} />Resume Preview</CardTitle></CardHeader>
                           <CardContent className="flex-1 overflow-y-auto">
                              {renderResumePreview()}
                           </CardContent>
                       </Card>
                       <div className="space-y-4 mt-6 flex-shrink-0">
                           <div className="flex items-center space-x-2 p-4 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white/10">
                               <input type="checkbox" id="pamtenLogo" className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" checked={showPamtenLogo} onChange={(e) => setShowPamtenLogo(e.target.checked)} />
                               <label htmlFor="pamtenLogo" className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Pamten Logo to Document</label>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleDownload('PDF')} disabled={loading}><Download size={16} className="mr-2" />Download PDF</Button>
                               <Button variant="outline" className="w-full" onClick={() => handleDownload('DOCX')} disabled={loading}><Download size={16} className="mr-2" />Download DOCX</Button>
                           </div>
                       </div>
                    </div>
                </main>
            </div>
        </CandidateLayout>
    );
}
