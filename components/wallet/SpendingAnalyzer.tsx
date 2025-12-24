
import React, { useState } from 'react';
import { analyzeSpending, SpendingAnalysis } from '../../services/ocrService';
import { useToasts } from '../ToastHost';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#8B5CF6'];

const SpendingAnalyzer: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [data, setData] = useState<SpendingAnalysis | null>(null);
    const { add: addToast } = useToasts();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setData(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setAnalyzing(true);
        try {
            const result = await analyzeSpending(file);
            setData(result);
            addToast({ title: "Analysis Ready", desc: "Adviser T has reviewed your statement.", emoji: "🧐" });
        } catch (e: any) {
            addToast({ title: "Analysis Failed", desc: "Could not process document.", emoji: "😥" });
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center">
                <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                    <span>📊</span> Spending Analyzer
                </h3>
                <span className="text-xs text-indigo-400 font-mono">BETA</span>
            </div>

            <div className="p-4">
                {!data && (
                    <div className="text-center space-y-4">
                        <p className="text-sm text-gray-600">
                            Upload your bank statement (PDF or Image). <br/>
                            Adviser T will find your <strong>Safe Savings Capacity</strong>.
                        </p>
                        <div className="flex justify-center">
                            <input type="file" id="stmt-upload" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                            <label 
                                htmlFor="stmt-upload" 
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium cursor-pointer hover:bg-slate-200 transition border border-slate-200"
                            >
                                {file ? file.name : "Select Statement"}
                            </label>
                        </div>
                        {file && (
                            <button 
                                onClick={handleAnalyze} 
                                disabled={analyzing}
                                className="w-full py-2 bg-brand text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50"
                            >
                                {analyzing ? 'Analyzing...' : 'Analyze My Spending'}
                            </button>
                        )}
                    </div>
                )}

                {data && (
                    <div className="animate-fade-in space-y-6">
                        {/* Advice Card */}
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl relative">
                            <div className="absolute -top-3 -right-2 text-3xl">🧙🏿‍♂️</div>
                            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-1">Adviser T says:</h4>
                            <p className="text-sm text-indigo-900 italic">"{data.advice}"</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <div className="text-xs text-gray-500">Income</div>
                                <div className="font-bold text-emerald-600">₦{data.total_income.toLocaleString()}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <div className="text-xs text-gray-500">Expenses</div>
                                <div className="font-bold text-rose-600">₦{data.total_expense.toLocaleString()}</div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={data.categories} 
                                        dataKey="amount" 
                                        nameKey="name" 
                                        cx="50%" cy="50%" 
                                        innerRadius={40} 
                                        outerRadius={60} 
                                        paddingAngle={5}
                                    >
                                        {data.categories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                {data.categories.slice(0,4).map((c, i) => (
                                    <div key={i} className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        {c.name}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div className="text-center pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-2">Recommended Ajo Contribution:</p>
                            <div className="text-3xl font-bold text-brand mb-4">₦{data.safe_savings.toLocaleString()}</div>
                            <button onClick={() => window.location.hash = '#explore'} className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-semibold">
                                Find Pools Matching ₦{data.safe_savings.toLocaleString()}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpendingAnalyzer;
