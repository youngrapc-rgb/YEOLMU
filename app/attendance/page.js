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
  
  const [inScheduleHours, setInScheduleHours] = useState('') 
  const [outScheduleHours, setOutScheduleHours] = useState('') 
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

  // --- 첫 로드 시 유저 데이터 및 초기 선택 날짜의 입력창 분할 매핑 처리 ---
  useEffect(() => { 
    fetchUserDataAndRecords().then(() => {
      // 초기 날짜(오늘)에 해당하는 기록이 있다면 분할 로직 실행
      const todayStr = new Date().toISOString().split('T')[0]
      setSelectedDate(todayStr)
    })
  }, [fetchUserDataAndRecords])

  // --- [추가] 선택된 날짜가 바뀌거나 전체 기록이 갱신되면 입력창 값 분할 동기화 ---
  useEffect(() => {
    const record = myRecords.find(r => r.work_date === selectedDate)
    if (record) {
      // 메모에서 [외: X.Xh] 또는 [외: Xh] 또는 [외: -Xh] 형태가 있는지 정확히 추출 (음수 매칭 추가)
      const match = record.memo?.match(/^\[외:\s*([-\d.]+)h\]/)
      if (match) {
        const outH = parseFloat(match[1]) || 0
        const totalH = parseFloat(record.working_hours) || 0
        setOutScheduleHours(String(outH))
        setInScheduleHours(String(Number((totalH - outH).toFixed(2)))) // 부동소수점 오차 방지 및 음수 연산 안전 처리
        setMemo(record.memo.replace(/^\[외:\s*[-\d.]+h\]\s*/, ''))
      } else {
        setInScheduleHours(String(record.working_hours))
        setOutScheduleHours('')
        setMemo(record.memo || '')
      }
    } else {
      setInScheduleHours('')
      setOutScheduleHours('')
      setMemo('')
    }
  }, [selectedDate, myRecords])

  const monthlyStats = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    
    const targetMonthRecords = myRecords.filter(r => r.work_date.startsWith(monthStr))
    const totalHours = targetMonthRecords.reduce((sum, r) => sum + (Number(r.working_hours) || 0), 0)
    // 음수 근무일도 기록이 존재하는 날이므로 0시간이 아닌 날을 모두 카운트합니다.
    const totalDays = targetMonthRecords.filter(r => Number(r.working_hours) !== 0).length

    return { totalHours: Number(totalHours.toFixed(2)), totalDays, month }
  }, [myRecords, currentDate])

  const currentRecord = myRecords.find(r => r.work_date === selectedDate)

  const handleDelete = async () => {
    if (!currentRecord) return
    if (confirm(`${selectedDate}의 근무 기록을 삭제하시겠습니까?`)) {
      const { error } = await supabase.from('attendance').delete().eq('id', currentRecord.id)
      if (error) alert('삭제 중 오류 발생')
      else {
        alert('삭제되었습니다.')
        setInScheduleHours(''); setOutScheduleHours(''); setMemo('');
        fetchUserDataAndRecords()
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const numInHours = parseFloat(inScheduleHours) || 0
    const numOutHours = parseFloat(outScheduleHours) || 0
    const totalHoursCombined = Number((numInHours + numOutHours).toFixed(2))

    // 0시간일 때만 입력을 막고, 음수(-) 시간은 정상 등록되도록 변경
    if (totalHoursCombined === 0) {
      return alert('근무 시간을 입력해주세요.')
    }

    let finalMemo = memo.trim()
    if (numOutHours !== 0) {
      finalMemo = `[외: ${numOutHours}h] ${finalMemo}`.trim()
    }

    const payload = {
      working_hours: totalHoursCombined, 
      memo: finalMemo,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata.full_name,
      birth_date: user.user_metadata.birth_date,
      work_date: selectedDate
    }

    const { error } = currentRecord
      ? await supabase.from('attendance').update({ working_hours: totalHoursCombined, memo: finalMemo }).eq('id', currentRecord.id)
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
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} style={{ backgroundColor: '#ffffff', border: '1px solid #eee' }} />)
    for (let d = 1; d <= lastDate; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const record = myRecords.find(r => r.work_date === dateStr)
      days.push(
        <div key={d} onClick={() => {
          setSelectedDate(dateStr) // 날짜 선택만 변경하며, 입력 데이터 연동은 상단 useEffect가 안전하게 가로챕니다.
        }} style={{
          padding: '10px', border: '1px solid #eee', minHeight: '60px', cursor: 'pointer',
          backgroundColor: selectedDate === dateStr ? '#e3f2fd' : (record ? '#f1f8e9' : '#ffffff'),
          color: '#111111'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#111111' }}>{d}</div>
          {record && <div style={{ fontSize: '10px', color: Number(record.working_hours) < 0 ? '#b71c1c' : '#2e7d32', fontWeight: 'bold' }}>{record.working_hours}h</div>}
        </div>
      )
    }
    return days
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#ffffff', color: '#111111', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#111111' }}>👤 {userName}님</span>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href='/login')} style={{ color: '#111111', backgroundColor: '#f5f5f5', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>로그아웃</button>
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
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{ color: '#111111', backgroundColor: '#ffffff', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>◀</button>
        <h3 style={{ color: '#111111', margin: 0, fontWeight: 'bold' }}>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
        <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{ color: '#111111', backgroundColor: '#ffffff', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>▶</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #ddd', marginBottom: '20px', backgroundColor: '#ffffff' }}>
        {['일','월','화','수','목','금','토'].map(day => <div key={day} style={{ padding: '5px', backgroundColor: '#f5f5f5', fontSize: '12px', textAlign: 'center', color: '#111111', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>{day}</div>)}
        {renderCalendar()}
      </div>

      <div style={{ padding: '20px', border: '2px solid #4CAF50', borderRadius: '10px', backgroundColor: '#ffffff' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#2e7d32', fontWeight: 'bold' }}>📍 {selectedDate} 근무 기록</h4>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333333', marginBottom: '5px' }}>⏱️ 근무표 내 추가근무시간</label>
              <input 
                type="number" step="0.5" placeholder="0" 
                value={inScheduleHours} onChange={e => setInScheduleHours(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#ffffff', color: '#111111', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333333', marginBottom: '5px' }}>🚗 근무표 외 추가근무시간</label>
              <input 
                type="number" step="0.5" placeholder="0" 
                value={outScheduleHours} onChange={e => setOutScheduleHours(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#ffffff', color: '#111111', fontSize: '16px', boxSizing: 'border-box' }}
              />
            </div>

            <input 
              type="text" placeholder="메모 (선택 사항)" 
              value={memo} onChange={e => setMemo(e.target.value)} 
              style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc', backgroundColor: '#ffffff', color: '#111111', fontSize: '16px' }}
            />
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button type="submit" style={{ flex: 2, padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                {currentRecord ? '기록 수정' : '기록 저장'}
              </button>
              {currentRecord && (
                <button type="button" onClick={handleDelete} style={{ flex: 1, padding: '12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
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