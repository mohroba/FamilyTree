import { useCallback, useState, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  NodeTypes,
  Panel,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Plus, 
  Users, 
  Network, 
  Trash2,
  Calendar,
  Smile,
  ChevronLeft,
  ChevronRight,
  Info,
  Archive,
  Download,
  Upload,
  Moon,
  Sun,
  Printer,
  FileJson,
  RotateCcw,
  RotateCw,
  LogOut,
  Settings,
  Image as ImageIcon,
  Palette,
  Cloud,
  Edit,
  X,
  Type
} from 'lucide-react';
import useLocalStorageState from 'use-local-storage-state';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import confetti from 'canvas-confetti';

import CustomNode from './components/CustomNode';
import { FamilyMember, RelationType, FamilyTree, AppState } from './types';
import { toPersianDigits } from './utils';

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const nodeTypes: NodeTypes = {
  member: CustomNode,
};

const DEFAULT_TREE: FamilyTree = {
  id: 'default',
  name: 'شجره‌نامه اصلی',
  nodes: [
    {
      id: 'root',
      type: 'member',
      position: { x: 300, y: 50 },
      data: { 
        name: 'حاج محمد علوی', 
        birthDate: '1285', 
        deathDate: '1360', 
        relation: 'پدربزرگ',
        avatar: '👴'
      },
    }
  ],
  edges: [],
  createdAt: Date.now()
};

function Flow() {
  const { fitView } = useReactFlow();
  const flowRef = useRef<HTMLDivElement>(null);
  
  const [appState, setAppState] = useLocalStorageState<AppState>('rabook-family-tree', {
    defaultValue: {
      currentTreeId: 'default',
      trees: [DEFAULT_TREE],
      darkMode: false
    }
  });

  const currentTree = appState.trees.find(t => t.id === appState.currentTreeId) || appState.trees[0];
  
  const [nodes, setNodes, onNodesChange] = useNodesState(currentTree.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentTree.edges);
  
  const [history, setHistory] = useState<{nodes: any[], edges: any[]}[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [relation, setRelation] = useState<RelationType>('فرزند');
  const [fatherId, setFatherId] = useState('');
  const [motherId, setMotherId] = useState('');
  const [spouseId, setSpouseId] = useState('');
  const [siblingId, setSiblingId] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tokens, setTokens] = useState<any>(null);
  const [editingNode, setEditingNode] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with persistent state
  useEffect(() => {
    const updatedTrees = appState.trees.map(t => 
      t.id === appState.currentTreeId ? { ...t, nodes, edges } : t
    );
    if (JSON.stringify(updatedTrees) !== JSON.stringify(appState.trees)) {
      setAppState({ ...appState, trees: updatedTrees });
    }
  }, [nodes, edges]);

  // Handle dark mode class
  useEffect(() => {
    if (appState.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appState.darkMode]);

  // History tracking
  useEffect(() => {
    const lastState = history[historyPointer];
    if (!lastState || JSON.stringify(lastState.nodes) !== JSON.stringify(nodes) || JSON.stringify(lastState.edges) !== JSON.stringify(edges)) {
      const newHistory = history.slice(0, historyPointer + 1);
      newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryPointer(newHistory.length - 1);
    }
  }, [nodes, edges]);

  // Context Menu Actions
  useEffect(() => {
    const handleNodeAction = (e: any) => {
      const { type, id } = e.detail;
      if (type === 'delete') {
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
      } else if (type === 'color') {
        const color = e.detail.value;
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, bgColor: color } } : n));
      } else if (type === 'edit') {
        const node = nodes.find(n => n.id === id);
        if (node) setEditingNode(node);
      } else if (type === 'image') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (ev: any) => {
          const file = ev.target.files[0];
          const reader = new FileReader();
          reader.onload = (re: any) => {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, image: re.target.result } } : n));
          };
          reader.readAsDataURL(file);
        };
        input.click();
      }
    };
    window.addEventListener('node-action', handleNodeAction);
    return () => window.removeEventListener('node-action', handleNodeAction);
  }, [setNodes, setEdges]);

  const undo = () => {
    if (historyPointer > 0) {
      const prevState = history[historyPointer - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryPointer(historyPointer - 1);
    }
  };

  const redo = () => {
    if (historyPointer < history.length - 1) {
      const nextState = history[historyPointer + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryPointer(historyPointer + 1);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addMember = () => {
    if (!name) return;
    const id = Date.now().toString();
    const avatar = relation === 'فرزند' ? '👦' : relation === 'همسر' ? '👩' : '👴';
    
    const newNode = {
      id,
      type: 'member',
      position: { x: 400 + (Math.random() * 100), y: 300 + (Math.random() * 100) },
      data: { name, birthDate, deathDate, relation, avatar },
    };

    let newEdges: any[] = [];

    if (relation === 'فرزند') {
      if (fatherId) newEdges.push({ id: `e-${fatherId}-${id}`, source: fatherId, target: id, label: 'پدر' });
      if (motherId) newEdges.push({ id: `e-${motherId}-${id}`, source: motherId, target: id, label: 'مادر' });
    } else if (relation === 'همسر') {
      if (spouseId) {
          newEdges.push({ 
            id: `e-${spouseId}-${id}`, 
            source: spouseId, 
            target: id, 
            label: 'همسر', 
            style: { strokeDasharray: '5,5', stroke: '#8C7355' } 
          });
      }
    } else if (relation === 'خواهر/برادر') {
      if (siblingId) {
        const siblingEdges = edges.filter(e => e.target === siblingId);
        siblingEdges.forEach(e => {
            newEdges.push({ 
                id: `e-${e.source}-${id}`, 
                source: e.source, 
                target: id, 
                label: e.label 
            });
        });
      }
    }

    setNodes((nds) => nds.concat(newNode));
    setEdges((eds) => eds.concat(newEdges));

    setName(''); setBirthDate(''); setDeathDate('');
    setFatherId(''); setMotherId(''); setSpouseId(''); setSiblingId('');
    
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#8C7355', '#6B7D6E'] });
  };

  const exportJson = () => {
    const data = JSON.stringify(currentTree, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${currentTree.name}.json`; a.click();
  };

  const importJson = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (imported.nodes && imported.edges) {
          setNodes(imported.nodes); setEdges(imported.edges);
        }
      } catch (err) { alert('فایل نامعتبر است'); }
    };
    reader.readAsText(file);
  };

  const exportImage = async () => {
    if (flowRef.current) {
      try {
        const viewport = flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) return;
        
        // Fix for "font is undefined" error: ensure font-family is a valid string
        const dataUrl = await toPng(viewport, {
          backgroundColor: appState.canvasBgColor || (appState.darkMode ? '#1A1A1A' : '#F5F2ED'),
          style: {
            transform: 'none',
            fontFamily: 'Inter, Tahoma, sans-serif'
          },
          cacheBust: true,
          fontEmbedCSS: '', // Disable font embedding if it causes issues
        });
        
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `rabook-family-tree-${Date.now()}.png`;
        a.click();
      } catch (err) {
        console.error('Export PNG failed:', err);
        alert('خطا در ذخیره تصویر');
      }
    }
  };

  const exportPdf = async () => {
    if (flowRef.current) {
      try {
        const viewport = flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
        if (!viewport) return;

        const dataUrl = await toPng(viewport, {
          backgroundColor: '#FFFFFF',
          style: {
            transform: 'none',
            fontFamily: 'Inter, Tahoma, sans-serif'
          },
          cacheBust: true,
          fontEmbedCSS: '',
        });

        const pdf = new jsPDF('l', 'px', [viewport.clientWidth, viewport.clientHeight]);
        pdf.addImage(dataUrl, 'PNG', 0, 0, viewport.clientWidth, viewport.clientHeight);
        pdf.save(`rabook-family-tree-${Date.now()}.pdf`);
      } catch (err) {
        console.error('Export PDF failed:', err);
        alert('خطا در ذخیره PDF');
      }
    }
  };

  const loginGoogle = async () => {
    const res = await fetch('/api/auth/google/url');
    const { url } = await res.json();
    const popup = window.open(url, 'google-auth', 'width=500,height=600');
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setTokens(event.data.tokens);
        window.removeEventListener('message', handleMessage);
      }
    };
    window.addEventListener('message', handleMessage);
  };

  const deleteTree = (id: string) => {
    if (appState.trees.length <= 1) {
      alert('حداقل یک شجره‌نامه باید وجود داشته باشد');
      return;
    }
    if (confirm('آیا از حذف این شجره‌نامه اطمینان دارید؟ تمامی اطلاعات آن پاک خواهد شد.')) {
      const newTrees = appState.trees.filter(t => t.id !== id);
      const nextId = newTrees[0].id;
      setAppState({ ...appState, trees: newTrees, currentTreeId: nextId });
      const nextTree = newTrees[0];
      setNodes(nextTree.nodes);
      setEdges(nextTree.edges);
    }
  };

  const createNewTree = () => {
    const treeName = prompt('نام شجره‌نامه جدید:');
    if (treeName) {
      const id = Date.now().toString();
      const newTree = { ...DEFAULT_TREE, id, name: treeName, createdAt: Date.now() };
      setAppState({ ...appState, trees: [...appState.trees, newTree], currentTreeId: id });
      setNodes(newTree.nodes); setEdges(newTree.edges);
    }
  };

  const saveToDrive = async () => {
    if (!tokens) return;
    try {
      const fileName = `${currentTree.name}.json`;
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
      };
      const fileContent = JSON.stringify(currentTree);
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([fileContent], { type: 'application/json' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        body: form,
      });

      if (res.ok) {
        alert('فایل با موفقیت در گوگل درایو ذخیره شد');
      } else {
        const err = await res.json();
        throw new Error(err.error.message);
      }
    } catch (err: any) {
      alert(`خطا در ذخیره در درایو: ${err.message}`);
    }
  };

  const updateNode = (id: string, newData: any) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...newData } } : n));
    setEditingNode(null);
  };

  return (
    <div className="flex flex-col h-screen font-sans selection:bg-app-accent selection:text-white bg-app-bg transition-colors duration-300">
      {/* Header */}
      <header className="h-16 bg-app-sidebar border-b border-app-border flex items-center justify-between px-6 shadow-sm z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => fitView()}>
            <div className="w-10 h-10 bg-app-accent rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
              <Network className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-app-accent leading-none">رابوک</h1>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">Rabook Family Tree</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-app-border mx-2" />
          
          <div className="flex items-center gap-2">
            <select 
              value={appState.currentTreeId}
              onChange={(e) => {
                const tree = appState.trees.find(t => t.id === e.target.value);
                if (tree) {
                  setAppState({ ...appState, currentTreeId: tree.id });
                  setNodes(tree.nodes); setEdges(tree.edges);
                }
              }}
              className="bg-transparent text-sm font-bold text-app-accent focus:outline-none border-b border-transparent hover:border-app-accent cursor-pointer"
            >
              {appState.trees.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={() => deleteTree(appState.currentTreeId)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-full transition-colors" title="حذف شجره‌نامه فعلی">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={createNewTree} className="p-1.5 hover:bg-app-bg rounded-full text-app-sage" title="ساخت شجره‌نامه جدید">
              <Plus className="w-4 h-4"/>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-app-bg p-1 rounded-xl border border-app-border mr-4">
            <button onClick={undo} disabled={historyPointer <= 0} className="p-2 hover:text-app-accent disabled:opacity-30"><RotateCcw className="w-4 h-4" /></button>
            <button onClick={redo} disabled={historyPointer >= history.length - 1} className="p-2 hover:text-app-accent disabled:opacity-30"><RotateCw className="w-4 h-4" /></button>
          </div>

          <button onClick={() => setAppState({...appState, darkMode: !appState.darkMode})} className="p-2.5 rounded-xl hover:bg-app-bg text-app-text transition-colors border border-transparent hover:border-app-border">
            {appState.darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {tokens ? (
             <div className="flex items-center gap-3 bg-app-bg px-3 py-1.5 rounded-xl border border-app-border border-dashed">
                <span className="text-[10px] font-bold text-app-sage">متصل به درایو</span>
                <button onClick={() => setTokens(null)} className="text-red-400 hover:text-red-500"><LogOut className="w-4 h-4"/></button>
             </div>
          ) : (
             <button onClick={loginGoogle} className="flex items-center gap-2 bg-app-sidebar px-4 py-2 rounded-xl border border-app-border text-xs font-bold shadow-sm hover:shadow-md transition-all">
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-4 h-4" />
                ورود با گوگل
             </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 overflow-hidden relative flex-row">
        <aside className={`${sidebarOpen ? 'w-[340px]' : 'w-0 overflow-hidden opacity-0'} bg-app-sidebar border-l border-app-border flex flex-col transition-all duration-300 relative z-20 shadow-xl`}>
          <button onClick={() => setSidebarOpen(false)} className="absolute left-[-15px] top-6 bg-app-sidebar border border-app-border p-1 rounded-full text-app-accent shadow-md z-40"><ChevronRight className="w-4 h-4" /></button>
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
            {editingNode ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-lg font-black text-app-accent flex items-center gap-2 underline underline-offset-8 decoration-app-sage"><Edit className="w-5 h-5" />ویرایش عضو</h2>
                    <button onClick={() => setEditingNode(null)} className="p-1.5 hover:bg-app-bg rounded-full text-gray-400"><X className="w-4 h-4"/></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400">نام کامل</label>
                    <input 
                      value={editingNode.data.name} 
                      onChange={e => setEditingNode({...editingNode, data: {...editingNode.data, name: e.target.value}})}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-app-accent/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400">تاریخ تولد</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={editingNode.data.birthDate}
                      onChange={(date: any) => setEditingNode({...editingNode, data: {...editingNode.data, birthDate: date?.format?.("YYYY/MM/DD") || ""}})}
                      calendarPosition="bottom-right"
                      inputClass="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm outline-none"
                      containerClassName="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400">تاریخ فوت</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={editingNode.data.deathDate}
                      onChange={(date: any) => setEditingNode({...editingNode, data: {...editingNode.data, deathDate: date?.format?.("YYYY/MM/DD") || ""}})}
                      calendarPosition="bottom-right"
                      inputClass="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm outline-none"
                      containerClassName="w-full"
                    />
                  </div>
                  <button 
                    onClick={() => updateNode(editingNode.id, editingNode.data)}
                    className="w-full bg-app-accent text-white font-black py-4 rounded-xl shadow-lg hover:opacity-90 transition-all mt-4"
                  >
                    ذخیره تغییرات
                  </button>
                  <button 
                    onClick={() => setEditingNode(null)}
                    className="w-full bg-app-bg text-app-text font-bold py-3 rounded-xl border border-app-border hover:bg-white dark:hover:bg-black transition-all"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-app-accent border-b-2 border-app-bg pb-2 flex items-center gap-2 underline underline-offset-8 decoration-app-sage"><Plus className="w-5 h-5" />افزودن عضو</h2>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Users className="w-3 h-3"/>نام کامل</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مریم محمدی" className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-app-accent/20 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Calendar className="w-3 h-3"/>تاریخ تولد</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={birthDate}
                      onChange={(date: any) => setBirthDate(date?.format?.("YYYY/MM/DD") || "")}
                      calendarPosition="bottom-right"
                      inputClass="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-app-accent/20 outline-none"
                      containerClassName="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Calendar className="w-3 h-3"/>تاریخ فوت (اختیاری)</label>
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={deathDate}
                      onChange={(date: any) => setDeathDate(date?.format?.("YYYY/MM/DD") || "")}
                      calendarPosition="bottom-right"
                      inputClass="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-app-accent/20 outline-none"
                      containerClassName="w-full"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Smile className="w-3 h-3"/>نوع نسبت جدید</label>
                      <select value={relation} onChange={e => setRelation(e.target.value as any)} className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-3 text-[12px]">
                          <option value="فرزند">فرزند</option>
                          <option value="همسر">همسر</option>
                          <option value="خواهر/برادر">خواهر/برادر</option>
                          <option value="ریشه">عضو مستقل (ریشه)</option>
                      </select>
                    </div>

                    {relation === 'فرزند' && (
                      <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-gray-400">پدر</label>
                              <select value={fatherId} onChange={e => setFatherId(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-xl px-2 py-3 text-[11px]">
                                  <option value="">نامشخص</option>
                                  {nodes.map(n => <option key={n.id} value={n.id}>{n.data.name}</option>)}
                              </select>
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-gray-400">مادر</label>
                              <select value={motherId} onChange={e => setMotherId(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-xl px-2 py-3 text-[11px]">
                                  <option value="">نامشخص</option>
                                  {nodes.map(n => <option key={n.id} value={n.id}>{n.data.name}</option>)}
                              </select>
                          </div>
                      </div>
                    )}

                    {relation === 'همسر' && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                          <label className="text-[10px] font-black uppercase text-gray-400">همسرِ</label>
                          <select value={spouseId} onChange={e => setSpouseId(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-3 text-[12px]">
                              <option value="">انتخاب عضو...</option>
                              {nodes.map(n => <option key={n.id} value={n.id}>{n.data.name}</option>)}
                          </select>
                      </div>
                    )}

                    {relation === 'خواهر/برادر' && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                          <label className="text-[10px] font-black uppercase text-gray-400">خواهر/برادرِ</label>
                          <select value={siblingId} onChange={e => setSiblingId(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-3 text-[12px]">
                              <option value="">انتخاب...</option>
                              {nodes.map(n => <option key={n.id} value={n.id}>{n.data.name}</option>)}
                          </select>
                      </div>
                    )}
                  </div>
                  <button onClick={addMember} className="w-full bg-app-accent hover:bg-app-accent/90 text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">ثبت در میراث</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Palette className="w-3.5 h-3.5"/>ظاهر نمایشگر</label>
              <div className="bg-app-bg p-3 rounded-xl border border-app-border space-y-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={appState.canvasBgColor || (appState.darkMode ? '#1A1A1A' : '#F5F2ED')} 
                    onChange={(e) => setAppState({...appState, canvasBgColor: e.target.value})}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-app-border bg-transparent outline-none p-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold">رنگ پس‌زمینه</span>
                    <button 
                      onClick={() => setAppState({...appState, canvasBgColor: undefined})}
                      className="text-[9px] text-app-accent hover:underline text-right"
                    >
                      حذف رنگ سفارشی
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Settings className="w-3 h-3"/>مدیریت و خروجی</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={exportImage} className="flex items-center gap-2 px-3 py-2.5 bg-app-bg rounded-xl border border-app-border text-[11px] font-bold hover:bg-white dark:hover:bg-black transition-colors"><ImageIcon className="w-3.5 h-3.5 text-blue-500" />ذخیره عکس</button>
                  <button onClick={exportPdf} className="flex items-center gap-2 px-3 py-2.5 bg-app-bg rounded-xl border border-app-border text-[11px] font-bold hover:bg-white dark:hover:bg-black transition-colors"><Printer className="w-3.5 h-3.5 text-red-500" />نسخه PDF</button>
                  <button onClick={exportJson} className="flex items-center gap-2 px-3 py-2.5 bg-app-bg rounded-xl border border-app-border text-[11px] font-bold hover:bg-white dark:hover:bg-black transition-colors"><FileJson className="w-3.5 h-3.5 text-yellow-600" />خروجی JSON</button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2.5 bg-app-bg rounded-xl border border-app-border text-[11px] font-bold hover:bg-white dark:hover:bg-black transition-colors"><Upload className="w-3.5 h-3.5 text-green-600" />بارگذاری</button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importJson} />
                </div>
                {tokens && (
                  <button onClick={saveToDrive} className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-3 bg-app-sage text-white rounded-xl text-[12px] font-bold hover:opacity-90 transition-all shadow-md">
                    <Cloud className="w-4 h-4" />
                    ذخیره مستقیم در گوگل درایو
                  </button>
                )}
            </div>

            <div className="mt-auto bg-app-bg/30 p-4 rounded-2xl border border-app-border border-dashed space-y-3">
              <div className="flex items-center gap-2 text-app-sage"><Info className="w-4 h-4"/><span className="text-[10px] font-black uppercase">اطلاعات</span></div>
              <p className="text-[11px] leading-relaxed opacity-70">برای ویرایش رنگ یا تصویر نودها، روی آن‌ها راست کلیک کنید. تغییرات شما به صورت خودکار در مرورگر ذخیره می‌شود.</p>
            </div>
          </div>
        </aside>

        <section className="flex-1 relative overflow-hidden" ref={flowRef}>
          {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="absolute right-4 top-4 z-20 bg-app-sidebar border border-app-border p-2 rounded-full shadow-lg text-app-accent"><ChevronLeft className="w-5 h-5"/></button>}
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={onConnect} 
            nodeTypes={nodeTypes} 
            fitView 
            colorMode={appState.darkMode ? 'dark' : 'light'}
            style={appState.canvasBgColor ? { backgroundColor: appState.canvasBgColor } : {}}
            className="bg-app-bg"
          >
            <Background variant={BackgroundVariant.Dots} gap={30} size={1} color={appState.darkMode ? '#444' : '#E0DDD7'} />
            <Controls className="!bg-app-sidebar !border-app-border !shadow-2xl" />
            <Panel position="top-left" className="bg-app-sidebar/60 backdrop-blur-sm px-4 py-2 rounded-full border border-app-border shadow-sm text-[11px] font-bold text-app-sage">سیستم شجره‌نامه رابوک ویرایش زمستان</Panel>
          </ReactFlow>
        </section>

        {/* Backdrop for mobile edit logic (optional) if needed, but not required since we use sidebar */}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}

