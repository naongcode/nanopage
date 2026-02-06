import React from 'react';

interface FieldOptionsProps {
  options: Array<{ label: string; value: string }> | Record<string, Array<{ label: string; value: string }>>;
  onSelect: (value: string) => void;
  currentValue: string;
}

export default function FieldOptions({ options, onSelect, currentValue }: FieldOptionsProps) {
  // options가 배열인지 객체인지 확인
  const isGrouped = !Array.isArray(options);

  // 콤마 기준으로 값 파싱 (다중 단어 값 지원)
  const parseValues = (text: string) => {
    return text.split(',').map(v => v.trim()).filter(v => v.length > 0);
  };

  const isSelected = (value: string) => {
    const values = parseValues(currentValue);
    return values.includes(value);
  };

  // 단순 배열 옵션용 토글 (멀티 선택)
  const handleOptionClick = (value: string) => {
    const values = parseValues(currentValue);
    const index = values.indexOf(value);

    if (index !== -1) {
      values.splice(index, 1);
    } else {
      values.push(value);
    }
    onSelect(values.join(', '));
  };

  // 그룹 옵션용 클릭 (그룹 내 단일 선택)
  const handleGroupedOptionClick = (value: string, groupName: string) => {
    const groupedOptions = options as Record<string, Array<{ label: string; value: string }>>;
    const groupValues = groupedOptions[groupName].map(o => o.value);
    const values = parseValues(currentValue);

    // 해당 그룹의 기존 선택값 제거
    const filtered = values.filter(v => !groupValues.includes(v));

    // 이미 선택된 값이면 제거만 (토글 해제), 아니면 새 값 추가
    if (!values.includes(value)) {
      filtered.push(value);
    }

    onSelect(filtered.join(', '));
  };

  if (isGrouped) {
    // 그룹화된 옵션 (타겟 고객, 시각적 컨셉 등)
    const groupedOptions = options as Record<string, Array<{ label: string; value: string }>>;

    return (
      <div className="space-y-3">
        {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
          <div key={groupName}>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {groupName === 'preference' && '선호도'}
              {groupName === 'age' && '연령대'}
              {groupName === 'occupation' && '직업'}
              {groupName === 'family' && '가족 구성'}
              {groupName === 'location' && '장소'}
              {groupName === 'lighting' && '조명'}
              {groupName === 'mood' && '분위기'}
              {groupName === 'color_scheme' && '색상 계열'}
              {groupName === 'colors' && '색상'}
            </p>
            <div className="flex flex-wrap gap-2">
              {groupOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleGroupedOptionClick(option.value, groupName)}
                  className={`px-3 py-1.5 text-sm rounded-full border-2 transition-all ${
                    isSelected(option.value)
                      ? 'bg-yellow-400 border-yellow-500 text-gray-900 font-semibold'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 단순 배열 옵션
  const arrayOptions = options as Array<{ label: string; value: string }>;

  return (
    <div className="flex flex-wrap gap-2">
      {arrayOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleOptionClick(option.value)}
          className={`px-3 py-1.5 text-sm rounded-full border-2 transition-all ${
            isSelected(option.value)
              ? 'bg-yellow-400 border-yellow-500 text-gray-900 font-semibold'
              : 'bg-white border-gray-300 text-gray-700 hover:border-yellow-400 hover:bg-yellow-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
