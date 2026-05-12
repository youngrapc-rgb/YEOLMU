'use client'

import Link from 'next/link'

export default function MainPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      fontFamily: 'sans-serif',
      backgroundColor: '#f5f7fa'
    }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>🍀 열무 출퇴근 시스템</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>오늘도 수고하셨습니다.</p>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 직원용 버튼 */}
        <Link href="/attendance" style={{
          padding: '20px 40px',
          backgroundColor: '#4caf50',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          근무시간 입력
        </Link>


      </div>
    </div>
  )
}