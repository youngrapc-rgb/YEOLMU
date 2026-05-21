'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// --- [대한민국 공휴일 데이터: 2025-2026] ---
const HOLIDAYS = {
  // 2025년
  "2025-01-01": "신정", "2025-01-27": "대체공휴일", "2025-01-28": "설날", "2025-01-29": "설날", "2025-01-30": "설날",
  "2025-03-01": "3·1절", "2025-03-03": "대체공휴일", "2025-05-05": "어린이날/부처님오신날", "2025-05-06": "대체공휴일",
  "2025-06-06": "현충일", "2025-08-15": "광복절", "2025-10-03": "개천절", "2025-10-05": "추석", "2025-10-06": "추석",
  "2025-10-07": "추석", "2025-10-08": "대체공휴일", "2025-10-09": "한글날", "2025-12-25": "성탄절",
  // 2026년
  "2026-01-01": "신정", "2026-02-15": "설날", "2026-02-16": "설날", "2026-02-17": "설날", "2026-02-18": "대체공휴일",
  "2026-03-01": "3·1절", "2026-03-02": "대체공휴일", "2026-05-05": "어린이날", "2026-05-24": "부처님오신날", "2026-05-25": "대체공휴일",
  "2026-06-03": "지방선거", "2026-06-06": "현충일", "2026-08-15": "광복절", "2026-08-17": "대체공휴일",
  "2026-09-23": "추석", "2026-09-24": "추석", "2026-09-25": "추석", "2026-09-26": "추석(대체)", "2026-10-03": "개천절",
  "2026-10-05": "대체공휴일", "2026-10-09": "한글날", "2026-12-25": "성탄절"
};

export default function AdminPage() {
  const [allRecords, setAllRecords] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBirthDate, setSelectedBirthDate] = useState('')

  const fetchData = useCallback(async () => {
    const { data: recs } = await supabase.from('attendance').select('*').order('work_date', { ascending: false })
    if (recs) {
      setAllRecords(recs)
      const uniqueUsers = Array.from(new Set(recs.map(r => `${r.user_name}|${r.birth_date}`)))
        .map(u => ({ user_name: u.split('|')[0], birth_date: u.split('|')[1] }))
      setAllUsers(uniqueUsers)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const nameMatch = r.user_name.includes(searchTerm)
      const birthMatch = selectedBirthDate ? r.birth_date === selectedBirthDate : true
      return nameMatch && birthMatch
    })
  }, [allRecords, searchTerm, selectedBirthDate])

  const monthlyStats = useMemo(() => {
    if (!searchTerm) return null
    const targetMonthRecords = filteredRecords.filter(r => r.work_date.startsWith(currentMonthStr))
    return {
      totalHours: targetMonthRecords.reduce((sum, r) => sum + (Number(r.working_hours) || 0), 0),
      totalDays: targetMonthRecords.filter(r => Number(r.working_hours) > 0).length
    }
  }, [filteredRecords, currentMonthStr, searchTerm])

  const renderCalendar = () => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay(); const lastDate = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} style={{ borderBottom: '1px solid #eee', backgroundColor: '#ffffff' }} />)
    
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const holidayName = HOLIDAYS[dateStr];
      const daily = filteredRecords.filter(r => r.work_date === dateStr)
      
      days.push(
        <div key={d} onClick={() => setSelectedDate(dateStr)} style={{ 
          padding: '8px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', 
          minHeight: '100px', cursor: 'pointer', backgroundColor: selectedDate === dateStr ? '#fff9c4' : '#ffffff',
          color: '#111111'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: holidayName ? '#d32f2f' : '#111111' }}>{d}</span>
            {holidayName && <span style={{ fontSize: '9px', color: '#d32f2f', fontWeight: 'bold' }}>{holidayName}</span>}
          </div>
          <div style={{ marginTop: '5px' }}>
            {daily.map(r => (
              <div key={r.id} style={{ 
                fontSize: '10px', padding: '2px 4px', borderRadius: '3px', marginBottom: '2px',
                backgroundColor: '#e3f2fd', color: '#1976d2', display: 'flex', justifyContent: 'space-between'
              }}>
                <span style={{ fontWeight: 'bold' }}>{searchTerm ? `${r.working_hours}h` : `${r.user_name.slice(0,2)} ${r.working_hours}h`}</span>
                {r.memo && <span>📝</span>}
              </div>
            ))}
          </div>
        </div>
      )
    }
    return days
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#ffffff', color: '#111111', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#111111', fontWeight: 'bold' }}>📊 근무 통합 관리 시스템 (공휴일 지원)</h2>
        <button style={{ padding: '8px 15px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Excel 다운로드</button>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" placeholder="직원 이름 검색" value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedBirthDate(''); }} 
            style={{ flex: 1, padding: '12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#ffffff', color: '#111111', fontSize: '16px' }}
          />
          {searchTerm && monthlyStats && (
            <div style={{ padding: '0 20px', borderLeft: '2px solid #ddd', fontSize: '16px', color: '#1976d2', fontWeight: 'bold' }}>
              {currentDate.getMonth()+1}월 합계: {monthlyStats.totalHours}시간 ({monthlyStats.totalDays}일 근무)
            </div>
          )}
        </div>

        {/* --- [기능 추가] 직원 검색창 아래 회원가입한 직원들 서제스트 목록 --- */}
        <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#555555', marginBottom: '6px' }}>👤 등록된 직원 선택:</div>
          {allUsers.length === 0 ? (
            <span style={{ fontSize: '13px', color: '#888888' }}>가입된 직원이 없습니다.</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {allUsers.map(u => (
                <button 
                  key={`${u.user_name}-${u.birth_date}`}
                  onClick={() => {
                    setSearchTerm(u.user_name);
                    setSelectedBirthDate(u.birth_date);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid #ccc',
                    backgroundColor: searchTerm === u.user_name && (selectedBirthDate === u.birth_date || !selectedBirthDate) ? '#1976d2' : '#ffffff',
                    color: searchTerm === u.user_name && (selectedBirthDate === u.birth_date || !selectedBirthDate) ? '#ffffff' : '#111111',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {u.user_name} {u.birth_date ? `(${u.birth_date})` : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {allUsers.filter(u => u.user_name === searchTerm).length > 1 && (
          <div style={{ marginTop: '10px', fontSize: '13px', color: '#111111' }}>
            📍 동명이인 생일 선택: {allUsers.filter(u => u.user_name === searchTerm).map(u => (
              <button key={u.birth_date} onClick={() => setSelectedBirthDate(u.birth_date)} style={{ marginLeft: '5px', padding: '3px 8px', border: '1px solid #ccc', backgroundColor: selectedBirthDate === u.birth_date ? '#856404' : '#ffffff', color: selectedBirthDate === u.birth_date ? '#ffffff' : '#111111', cursor: 'pointer' }}>{u.birth_date}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '20px' }}>
        <div style={{ borderLeft: '1px solid #eee', borderTop: '1px solid #eee', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f1f3f4', alignItems: 'center' }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{ padding: '4px 10px', color: '#111111', backgroundColor: '#ffffff', border: '1px solid #ccc', cursor: 'pointer', fontWeight: 'bold' }}>◀</button>
            <strong style={{ fontSize: '18px', color: '#111111' }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</strong>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{ padding: '4px 10px', color: '#111111', backgroundColor: '#ffffff', border: '1px solid #ccc', cursor: 'pointer', fontWeight: 'bold' }}>▶</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#ffffff' }}>
            {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ padding: '10px', backgroundColor: '#fafafa', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', color: '#111111' }}>{d}</div>)}
            {renderCalendar()}
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', backgroundColor: '#ffffff' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#111111', fontWeight: 'bold' }}>📍 {selectedDate} 상세 내역</h3>
          {filteredRecords.filter(r => r.work_date === selectedDate).length === 0 ? (
            <div style={{ fontSize: '14px', color: '#666666' }}>선택된 날짜에 근무 기록이 없습니다.</div>
          ) : (
            filteredRecords.filter(r => r.work_date === selectedDate).map(r => (
              <div key={r.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#111111' }}>{r.user_name} <span style={{fontSize:'11px', color:'#666666'}}>({r.birth_date})</span></strong>
                  <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{r.working_hours}시간</span>
                </div>
                {r.memo && <div style={{ fontSize: '12px', color: '#111111', marginTop: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px', borderLeft: '3px solid #2e7d32' }}>📝 {r.memo}</div>}
                <button onClick={async () => { if(confirm('삭제하시겠습니까?')){ await supabase.from('attendance').delete().eq('id',r.id); fetchData(); } }} style={{ marginTop: '10px', color: '#d32f2f', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', padding: 0 }}>기록 삭제</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}