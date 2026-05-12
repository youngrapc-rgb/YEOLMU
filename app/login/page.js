'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert('로그인 실패: ' + error.message)
    else {
      alert('로그인 성공!')
      window.location.href = '/attendance'
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '400px', margin: '100px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>출퇴근 관리 로그인</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        <input 
          type="email" placeholder="이메일" value={email} 
          onChange={(e) => setEmail(e.target.value)} required
          style={{ padding: '10px' }}
        />
        <input 
          type="password" placeholder="비밀번호" value={password} 
          onChange={(e) => setPassword(e.target.value)} required
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          로그인
        </button>
        <hr style={{ width: '100%', margin: '10px 0' }} />
        <button 
          type="button" 
          onClick={() => window.location.href = '/signup'} 
          style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          신규 회원가입하러 가기
        </button>
      </form>
    </div>
  )
}