'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// --- [대한민국 공휴일 데이터 생략] ---
const HOLIDAYS = { /* 기존 데이터 동일 */ };

export default function AdminPage() {
  const [allRecords, setAllRecords] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBirthDate, setSelectedBirthDate] = useState('')

  // --- [보안 관련 상태 추가] ---
  const [isAuthenticated, setIsAuthenticated] = useState(false) // 암호 인증 여부
  const [passwordInput, setPasswordInput] = useState('') // 입력한 암호
  const ADMIN_PASSWORD = "qnrdj123!" // 설정할 관리자 암호 (원하는 대로 바꾸세요!)

  const fetchData = useCallback(async () => {
    const { data: recs } = await supabase.from('attendance').select('*').order('work_date', { ascending: false })
    if (recs) {
      setAllRecords(recs)
      const uniqueUsers = Array.from(new Set(recs.map(r => `${r.user_name}|${r.birth_date}`)))
        .map(u => ({ user_name: u.split('|')[0], birth_date: u.split('|')[1] }))
      setAllUsers(uniqueUsers)
    }
  }, [])

  // 암호 확인 함수
  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      fetchData()
    } else {
      alert('암호가 틀렸습니다.')
      setPasswordInput('')
    }
  }

  // 인증되었을 때만 데이터 로드
  useEffect(() => { 
    if (isAuthenticated) fetchData() 
  }, [fetchData, isAuthenticated])

  // --- [미인증 시 보여줄 화면: 암호 입력창] ---
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        height: '100vh', backgroundColor: '#f5f5f5', fontFamily: 'sans-serif' 
      }}>
        <div style={{ padding: '30px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '20px' }}>🔒 관리자 인증</h2>
          <form onSubmit={handlePasswordSubmit}>
            <input 
              type="password" 
              placeholder="관리자 암호를 입력하세요" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ padding: '12px', width: '200px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '15px', display: 'block' }}
            />
            <button type="submit" style={{ 
              width: '100%', padding: '12px', backgroundColor: '#2e7d32', color: 'white', 
              border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' 
            }}>
              접속하기
            </button>
          </form>
          <button onClick={() => window.location.href='/'} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px' }}>
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  // --- [인증 완료 시 보여줄 기존 관리자 화면] ---
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
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} style={{ borderBottom: '1px solid #eee' }} />)
    
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const holidayName = HOLIDAYS[dateStr];
      const daily = filteredRecords.filter(r => r.work_date === dateStr)
      
      days.push(
        <div key={d} onClick={() => setSelectedDate(dateStr)} style={{ 
          padding: '8px', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', 
          minHeight: '100px', cursor: 'pointer', backgroundColor: selectedDate === dateStr ? '#fff9c4' : 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: holidayName ? '#d32f2f' : '#888' }}>{d}</span>
            {holidayName && <span style={{ fontSize: '9px', color: '#d32f2f', fontWeight: 'bold' }}>{holidayName}</span>}
          </div>
          <div style={{ marginTop: '5px' }}>
            {daily.map(r => (
              <div key={r.id} style={{ 
                fontSize: '10px', padding: '2px 4px', borderRadius: '3px', marginBottom: '2px',
                backgroundColor: '#e3f2fd', color: '#1976d2', display: 'flex', justifyContent: 'space-between'
              }}>
                <span>{searchTerm ? `${r.working_hours}h` : `${r.user_name.slice(0,2)} ${r.working_hours}h`}</span>
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>📊 근무 통합 관리 시스템 (인증됨)</h2>
        <button onClick={() => setIsAuthenticated(false)} style={{ padding: '8px 15px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>잠금</button>
      </div>
      
      {/* ... 나머지 기존 JSX 코드 동일 ... */}
      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" placeholder="직원 이름 검색" value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setSelectedBirthDate(''); }} 
            style={{ flex: 1, padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          {searchTerm && monthlyStats && (
            <div style={{ padding: '0 20px', borderLeft: '2px solid #ddd', fontSize: '16px', color: '#1976d2', fontWeight: 'bold' }}>
              {currentDate.getMonth()+1}월 합계: {monthlyStats.totalHours}시간 ({monthlyStats.totalDays}일 근무)
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '20px' }}>
        <div style={{ borderLeft: '1px solid #eee', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f1f3f4' }}>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>◀</button>
            <strong style={{ fontSize: '18px' }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</strong>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>▶</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {['일','월','화','수','목','금','토'].map(d => <div key={d} style={{ padding: '10px', backgroundColor: '#fafafa', borderRight: '1px solid #eee', borderBottom: '1px solid #eee', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>{d}</div>)}
            {renderCalendar()}
          </div>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', backgroundColor: '#fff' }}>
          <h3 style={{ marginTop: 0, fontSize: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>📍 {selectedDate} 상세 내역</h3>
          {filteredRecords.filter(r => r.work_date === selectedDate).map(r => (
            <div key={r.id} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{r.user_name} <span style={{fontSize:'11px', color:'#999'}}>({r.birth_date})</span></strong>
                <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{r.working_hours}시간</span>
              </div>
              {r.memo && <div style={{ fontSize: '12px', color: '#444', marginTop: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px', borderLeft: '3px solid #2e7d32' }}>📝 {r.memo}</div>}
              <button onClick={async () => { if(confirm('삭제하시겠습니까?')){ await supabase.from('attendance').delete().eq('id',r.id); fetchData(); } }} style={{ marginTop: '10px', color: '#d32f2f', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px' }}>기록 삭제</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}