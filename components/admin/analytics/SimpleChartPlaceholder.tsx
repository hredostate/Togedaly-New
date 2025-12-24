import React from 'react';

interface SimpleChartPlaceholderProps {
    title?: string;
}

const SimpleChartPlaceholder: React.FC<SimpleChartPlaceholderProps> = ({ title }) => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-slate-50 border border-dashed rounded-lg">
            <div className="text-center text-sm text-gray-500">
                <p className="font-semibold">{title || 'Chart'}</p>
                <p>(Chart would be displayed here in a full app)</p>
            </div>
        </div>
    );
};

export default SimpleChartPlaceholder;
