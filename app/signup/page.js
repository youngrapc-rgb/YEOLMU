'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [birth, setBirth] = useState('')

  const handleSignUp = async (e) => {
    e.preventDefault()
    
    if (birth.length !== 6) {
      return alert('생년월일은 6자리로 입력해주세요 (예: 950101)')
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          birth_date: birth
        }
      }
    })

    if (error) {
      alert('회원가입 실패: ' + error.message)
    } else {
      alert('회원가입 성공! 로그인 페이지로 이동합니다.')
      window.location.href = '/login'
    }
  }

  return (
    <div style={{ padding: '30px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>신규 회원가입</h2>
      <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '10px' }} />
        <input type="text" placeholder="생년월일 (6자리)" value={birth} onChange={(e) => setBirth(e.target.value)} maxLength={6} required style={{ padding: '10px' }} />
        <input type="email" placeholder="이메일 주소" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '10px' }} />
        <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '10px' }} />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>가입하기</button>
      </form>
    </div>
  )
}