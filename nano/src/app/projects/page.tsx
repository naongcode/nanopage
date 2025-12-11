'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';

export default function ProjectsPage() {
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
            onClick={() => router.push('/')}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-lg"
          >
            홈으로 돌아가기
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">프로젝트 목록 📁</h1>
            <p className="text-gray-600">
              총 {projects.length}개의 프로젝트
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
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
              onClick={() => router.push('/')}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg"
            >
              첫 프로젝트 만들기
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow p-6 cursor-pointer"
                onClick={() => router.push(`/result?id=${project.id}`)}
              >
                {/* 제품 이미지 */}
                {project.product_images && project.product_images.length > 0 && (
                  <div className="mb-4 h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={project.product_images[0]}
                      alt={project.project_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* 프로젝트 정보 */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    {project.project_name}
                  </h3>
                  <p className="text-sm text-gray-500">{project.category}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    타겟: {project.target_customer}
                  </p>

                  {/* 셀링 포인트 */}
                  <div className="flex flex-wrap gap-1 pt-2">
                    {[
                      project.selling_point_1,
                      project.selling_point_2,
                      project.selling_point_3,
                    ].map((point, idx) => (
                      <span
                        key={idx}
                        className="inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                      >
                        {point}
                      </span>
                    ))}
                  </div>

                  {/* 날짜 */}
                  <p className="text-xs text-gray-400 pt-2">
                    {new Date(project.created_at!).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/result?id=${project.id}`);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    결과 보기
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/edit?id=${project.id}`);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id!);
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    삭제
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
