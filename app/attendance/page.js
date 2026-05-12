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
    if (!user) { window.location.href = '/login'; return; }
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
          padding: '10px', border: '1px solid #eee', minHeight: '60px', cursor: 'pointer',
          // 선택된 날짜와 기록 있는 날짜 색상 명시
          backgroundColor: selectedDate === dateStr ? '#e3f2fd' : (record ? '#f1f8e9' : '#ffffff'),
          color: '#333' 
        }}>
          <div style={{ fontSize: '12px', color: '#666' }}>{d}</div>
          {record && <div style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 'bold' }}>{record.working_hours}h</div>}
        </div>
      )
    }
    return days
  }

  return (
    <div style={{ 
      // 배경색 흰색 고정 및 글자색 검정 고정
      backgroundColor: '#ffffff', 
      color: '#000000',
      minHeight: '100vh',
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'sans-serif' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>👤 {userName}님</span>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href='/login')}
          style={{ padding: '5px 10px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', color: '#333' }}
        >
          로그아웃
        </button>
      </div>

      <div style={{ 
        marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', 
        borderRadius: '10px', border: '1px solid #c8e6c9', textAlign: 'center' 
      }}>
        <strong style={{ color: '#2e7d32' }}>📊 {monthlyStats.month}월 근무 합계</strong>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#1b5e20' }}>
          {monthlyStats.totalHours}시간 / {monthlyStats.totalDays}일 근무
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{ padding: '5px 15px', fontSize: '18px', background: 'none', border: '1px solid #ddd', borderRadius: '5px', color: '#333' }}>◀</button>
        <h3 style={{ margin: 0, color: '#000' }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{ padding: '5px 15px', fontSize: '18px', background: 'none', border: '1px solid #ddd', borderRadius: '5px', color: '#333' }}>▶</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #ddd', backgroundColor: '#fff', marginBottom: '20px' }}>
        {['일','월','화','수','목','금','토'].map(day => (
          <div key={day} style={{ padding: '5px', backgroundColor: '#f9f9f9', fontSize