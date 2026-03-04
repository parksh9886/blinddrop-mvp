import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const DashboardRedirect: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate('/');
            return;
        }

        const fetchHandleAndRedirect = async () => {
            try {
                const { data } = await supabase
                    .from('users')
                    .select('handle')
                    .eq('id', user.id)
                    .single();

                if (data && data.handle) {
                    navigate(`/u/${data.handle}`, { replace: true });
                } else {
                    navigate('/', { replace: true }); // Fallback to landing if no handle
                }
            } catch (error) {
                console.error('Error fetching handle for redirect:', error);
                navigate('/', { replace: true });
            }
        };

        fetchHandleAndRedirect();
    }, [user, authLoading, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );
};

export default DashboardRedirect;
