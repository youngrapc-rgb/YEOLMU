'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AttendancePage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [myRecords, setMyRecords] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [memo, setMemo] = useState('')

  // 유저 데이터 및 기록 가져오기
  const fetchUserDataAndRecords = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    // 유저가 없으면 메인 페이지로 튕겨내기
    if (!user) {
      router.push('/')
      return
    }
    
    setUserName(user.user_metadata.full_name || '사용자')
    
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
    
    if (data) setMyRecords(data)
  }, [router])

  useEffect(() => {
    fetchUserDataAndRecords()
  }, [fetchUserDataAndRecords])

  // 월간 통계 계산
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

  // 삭제 로직
  const handleDelete = async () => {
    if (!currentRecord) return
    if (confirm(`${selectedDate}의 근무 기록을 삭제하시겠습니까?`)) {
      const { error } = await supabase.from('attendance').delete().eq('id', currentRecord.id)
      if (error) {
        alert('삭제 중 오류 발생')
      } else {
        alert('삭제되었습니다.')
        router.push('/') // 삭제 후 메인으로 이동
      }
    }
  }

  // 저장/수정 로직
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
      router.push('/') // 저장 후 메인으로 이동
    } else {
      alert('저장 실패: ' + error.message)
    }
  }

  // 달력 렌더링
  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const lastDate = new Date(year, month + 1, 0).getDate()
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
          backgroundColor: selectedDate === dateStr ? '#e3f2fd' : (record ? '#f1f8e9' : 'white'),
          color: '#333'
        }}>
          <div style={{ fontSize: '12px' }}>{d}</div>
          {record && <div style={{ fontSize: '10px', color: '#2e7d32', fontWeight: 'bold' }}>{record.working_hours}h</div>}
        </div>
      )
    }
    return days
  }

  return (
    <div style={{ 
      padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif',
      backgroundColor: '#ffffff', color: '#333333', minHeight: '100vh' 
    }}>
      {/* 상단 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#000' }}>👤 {userName}님</span>
        <button 
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/')
          }}
          style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f5f5f5', cursor: 'pointer', color: '#333' }}
        >
          로그아웃
        </button>
      </div>

      {/* 월 합계 요약 */}
      <div style={{ 
        marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e9', 
        borderRadius: '10px', border: '1px solid #c8e6c9', textAlign: 'center' 
      }}>
        <strong style={{ color: '#2e7d32' }}>📊 {monthlyStats.month}월 근무 합계</strong>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '5px', color: '#1b5e20' }}>
          {monthlyStats.totalHours}시간 / {monthlyStats.totalDays}일 근무
        </div>
      </div>

      {/* 달력 컨트롤 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{ padding: '5px 10px' }}>◀</button>
        <h3 style={{ color: '#000', margin: 0 }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{ padding: '5px 10px' }}>▶</button>
      </div>

      {/* 달력 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #ddd', marginBottom: '20px', backgroundColor: '#fff' }}>
        {['일','월','화','수','목','금','토'].map(day => (
          <div key={day} style={{ padding: '5px', backgroundColor: '#f5f5f5', fontSize: '12px', textAlign: 'center', color: '#333', borderBottom: '1px solid #ddd' }}>{day}</div>
        ))}
        {renderCalendar()}
      </div>

      {/* 입력 폼 */}
      <div style={{ padding: '20px', border: '2px solid #4CAF50', borderRadius: '10px', backgroundColor: '#fff' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2e7d32' }}>📍 {selectedDate} 근무 기록</h4>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="number" step="0.5" placeholder="근무 시간 입력 (숫자)" 
              value={hours} onChange={e => setHours(e.target.value)} required 
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px', color: '#000', backgroundColor: '#fff' }}
            />
            <input 
              type="text" placeholder="메모 (선택 사항)" 
              value={memo} onChange={e => setMemo(e.target.value)} 
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px', color: '#000', backgroundColor: '#fff' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button type="submit" style={{ flex: 2, padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
                {currentRecord ? '기록 수정' : '기록 저장'}
              </button>
              {currentRecord && (
                <button type="button" onClick={handleDelete} style={{ flex: 1, padding: '15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
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