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
      <p style={{ color: '#666', marginBottom: '30px' }}>본인의 권한에 맞는 페이지로 이동해주세요.</p>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 직원용 버튼 */}
        <Link href="/worker" style={{
          padding: '20px 40px',
          backgroundColor: '#4caf50',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          직원 출퇴근
        </Link>

        {/* 관리자용 버튼 */}
        <Link href="/admin" style={{
          padding: '20px 40px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          관리자 로그인
        </Link>
      </div>
    </div>
  )
}