'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('프로젝트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== id));
      alert('삭제되었습니다.');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-lg"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">나노바나나 🍌</h1>
            <p className="text-gray-600">
              총 {projects.length}개의 프로젝트
            </p>
          </div>
          <button
            onClick={() => router.push('/new')}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            + 새 프로젝트
          </button>
        </header>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              아직 생성된 프로젝트가 없습니다.
            </p>
            <button
              onClick={() => router.push('/new')}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg"
            >
              첫 프로젝트 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-white rounded-lg shadow hover:shadow-xl transition-all p-2 cursor-pointer relative"
                onClick={() => router.push(`/result?id=${project.id}`)}
              >
                {/* 삭제 버튼 - 우측 상단 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project.id!);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-xs rounded-full transition-colors z-20 opacity-0 group-hover:opacity-100"
                  title="삭제"
                >
                  ✕
                </button>

                {/* 제품 썸네일 */}
                {project.product_images && project.product_images.length > 0 ? (
                  <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={project.product_images[0]}
                      alt={project.project_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-3xl mb-2">
                    📦
                  </div>
                )}

                {/* 프로젝트 정보 */}
                <h3 className="font-bold text-gray-900 truncate text-sm mb-1 pr-6">
                  {project.project_name}
                </h3>
                <p className="text-xs text-gray-500 truncate mb-2">
                  {project.category}
                </p>

                {/* 액션 버튼 */}
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/edit?id=${project.id}`);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1.5 px-1 rounded transition-colors"
                  >
                    입력
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/result?id=${project.id}`);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1.5 px-1 rounded transition-colors"
                  >
                    시나리오
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/editor/${project.id}`);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold py-1.5 px-1 rounded transition-colors"
                  >
                    상세
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
