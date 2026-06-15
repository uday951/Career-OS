import React from 'react';

export default function ResumePreview({ resumeJson }) {
  if (!resumeJson) return null;

  const r = resumeJson;

  return (
    <div className="bg-white text-black font-serif text-[11px] leading-tight p-6 min-h-[700px] shadow-2xl rounded" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Header */}
      <div className="text-center border-b border-black pb-2 mb-3">
        <h1 className="text-[18px] font-bold tracking-wide">{r.fullName}</h1>
        <div className="text-[10px] mt-1 flex flex-wrap justify-center gap-x-3 text-gray-700">
          {r.phone && <span>{r.phone}</span>}
          {r.email && <a href={`mailto:${r.email}`} className="text-blue-700 underline">{r.email}</a>}
          {r.location && <span>{r.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {r.summary && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Summary</div>
          <p className="text-gray-800">{r.summary}</p>
        </div>
      )}

      {/* Experience */}
      {r.experience?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Experience</div>
          {r.experience.map((exp, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between items-start">
                <span className="font-bold">{exp.position}</span>
                <span className="text-gray-600 text-[10px]">{exp.startDate} – {exp.endDate || 'Present'}</span>
              </div>
              <div className="flex justify-between">
                <span className="italic">{exp.company}</span>
              </div>
              {exp.description && <p className="text-gray-800 ml-2 text-[10px]">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {r.education?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Education</div>
          {r.education.map((edu, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between items-start">
                <span className="font-bold">{edu.degree}</span>
                <span className="text-gray-600 text-[10px]">{edu.graduationDate}</span>
              </div>
              <div className="italic">{edu.school}</div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {r.skills?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Technical Skills</div>
          {r.skills.map((skill, i) => (
            <div key={i} className="text-[10px] mb-1">
              <span className="font-bold">{skill.category}:</span> {skill.items.join(', ')}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {r.certifications?.length > 0 && (
        <div className="mb-3">
          <div className="text-[12px] font-bold uppercase border-b border-black mb-1 tracking-wider">Certifications</div>
          <ul className="list-disc ml-4 space-y-0.5">
            {r.certifications.map((c, i) => (
              <li key={i} className="text-[10px]">{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
