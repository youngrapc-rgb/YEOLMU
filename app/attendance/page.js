'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AttendancePage() {
  const [userName, setUserName] = useState('')
  const [myRecords, setMyRecords] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [memo, setMemo] = useState('')

  const fetchUserDataAndRecords = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    // 로그인 안되어 있으면 메인 페이지로 보냄
    if (!user) { window.location.href = '/'; return; }
    setUserName(user.user_metadata.full_name || '사용자')
    
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
    
    if (data) setMyRecords(data)
  }, [])

  useEffect(() => { fetchUserDataAndRecords() }, [fetchUserDataAndRecords])

  const monthlyStats = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    
    const targetMonthRecords = myRecords.filter(r => r.work_date.startsWith(monthStr))
    const totalHours = targetMonthRecords.reduce((sum, r) => sum + (Number(r.working_hours) || 0), 0)
    const totalDays = targetMonthRecords.filter(r => Number(r.working_hours) > 0).length

    return { totalHours, totalDays, month }
  }, [myRecords, currentDate])

  const currentRecord = myRecords.find(r => r.work_date === selectedDate)

  const handleDelete = async () => {
    if (!currentRecord) return
    if (confirm(`${selectedDate}의 근무 기록을 삭제하시겠습니까?`)) {
      const { error } = await supabase.from('attendance').delete().eq('id', currentRecord.id)
      if (error) alert('삭제 중 오류 발생')
      else {
        alert('삭제되었습니다.')
        setHours(''); setMemo('');
        fetchUserDataAndRecords()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const numHours = parseFloat(hours)
    if (isNaN(numHours)) return alert('시간을 숫자로 입력해주세요.')

    const payload = {
      working_hours: numHours,
      memo: memo,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata.full_name,
      birth_date: user.user_metadata.birth_date,
      work_date: selectedDate
    }

    const { error } = currentRecord
      ? await supabase.from('attendance').update({ working_hours: numHours, memo }).eq('id', currentRecord.id)
      : await supabase.from('attendance').insert([payload])

    if (!error) {
      alert('저장되었습니다.')
      fetchUserDataAndRecords()
    } else {
      alert('저장 실패: ' + error.message)
    }
  }

  const renderCalendar = () => {
    const year = currentDate.getFullYear(); const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay(); const lastDate = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />)
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const record = myRecords.find(r => r.work_date === dateStr)
      days.push(
        <div key={d} onClick={() => {
          setSelectedDate(dateStr)
          setHours(record ? String(record.working_hours) : '')
          setMemo(record ? record.memo || '' : '')
        }} style={{
          padding: '10px', border: '1px solid #eee', minHeight: '65px', cursor: 'pointer',
          backgroundColor: selectedDate === dateStr ? '#e3f2fd' : (record ? '#f1f8e9' : 'white'),
          color: '#333' // 달력 날짜 색상 고정
        }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{d}</div>
          {record && <div style={{ fontSize: '11px', color: '#2e7d32', fontWeight: 'bold', marginTop: '4px' }}>{record.working_hours}h</div>}
        </div>
      )
    }
    return days
  }

  return (
    <div style={{ 
      // [보안/가독성] 모바일 다크모드 방지용 스타일
      backgroundColor: '#ffffff', 
      color: '#333333', 
      minHeight: '100vh', 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'sans-serif' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#000' }}>👤 {userName}님</span>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href='/')}
          style={{ padding: '6px 12px', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: '#f5f5f5', color: '#333', cursor: 'pointer' }}
        >
          로그아웃
        </button>
      </div>

      <div style={{ 
        marginBottom: '25px', padding: '15px', backgroundColor: '#e8f5e9', 
        borderRadius: '12px', border: '1px solid #c8e6c9', textAlign: 'center' 
      }}>
        <strong style={{ color: '#2e7d32', fontSize: '15px' }}>📊 {monthlyStats.month}월 근무 현황</strong>
        <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '8px', color: '#1b5e20' }}>
          {monthlyStats.totalHours}시간 / {monthlyStats.totalDays}일 근무
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#000' }}>◀</button>
        <h3 style={{ margin: 0, color: '#000' }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#000' }}>▶</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden', marginBottom: '25px', backgroundColor: '#fff' }}>
        {['일','월','화','수','목','금','토'].map(day => (
          <div key={day} style={{ padding: '8px 0', backgroundColor: '#f8f9fa', fontSize: '12px', textAlign: 'center', color: day === '일' ? 'red' : day === '토' ? 'blue' : '#333', borderBottom: '1px solid #ddd' }}>{day}</div>
        ))}
        {renderCalendar()}
      </div>

      <div style={{ padding: '20px', border: '2px solid #4CAF50', borderRadius: '15px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2e7d32', fontSize: '17px' }}>📍 {selectedDate} 기록하기</h4>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px' }}>근무 시간</label>
              <input 
                type="number" step="0.5" placeholder="시간 입력 (예: 8)" 
                value={hours} onChange={e => setHours(e.target.value)} required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px', backgroundColor: '#fff', color: '#000' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px' }}>메모</label>
              <input 
                type="text" placeholder="간단한 메모" 
                value={memo} onChange={e => setMemo(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '16px', backgroundColor: '#fff', color: '#000' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ flex: 2, padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                {currentRecord ? '기록 수정' : '기록 저장'}
              </button>
              {currentRecord && (
                <button type="button" onClick={handleDelete} style={{ flex: 1, padding: '15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                  삭제
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}