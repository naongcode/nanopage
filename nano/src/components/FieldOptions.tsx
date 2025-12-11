import React from 'react';

interface FieldOptionsProps {
  options: Array<{ label: string; value: string }> | Record<string, Array<{ label: string; value: string }>>;
  onSelect: (value: string) => void;
  currentValue: string;
}

export default function FieldOptions({ options, onSelect, currentValue }: FieldOptionsProps) {
  // options가 배열인지 객체인지 확인
  const isGrouped = !Array.isArray(options);

  const handleOptionClick = (value: string) => {
    // 공백으로 분리하여 정확한 값이 있는지 확인
    const values = currentValue.split(/\s+/).filter(v => v.length > 0);
    const index = values.indexOf(value);

    if (index !== -1) {
      // 이미 있으면 제거
      values.splice(index, 1);
      onSelect(values.join(' '));
    } else {
      // 없으면 추가
      const newValue = currentValue ? `${currentValue} ${value}` : value;
      onSelect(newValue);
    }
  };

  const isSelected = (value: string) => {
    // 정확한 단어 매칭 (부분 문자열이 아닌)
    const values = currentValue.split(/\s+/).filter(v => v.length > 0);
    return values.includes(value);
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
