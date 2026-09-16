import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { UtensilsCrossed } from 'lucide-react'

export default function Login(){
 const { user } = useAuth(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [msg,setMsg]=useState(''); const [busy,setBusy]=useState(false)
 if(user) return <Navigate to="/" replace/>
 const entrar=async(e)=>{e.preventDefault();setBusy(true);setMsg('');const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setMsg('Correo o contraseña incorrectos.');setBusy(false)}
 const recuperar=async()=>{if(!email)return setMsg('Escribe primero tu correo.');const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/perfil'});setMsg(error?error.message:'Te enviamos un enlace de recuperación al correo.')}
 return <div className="login-page"><div className="login-card"><div className="login-icon"><UtensilsCrossed size={30}/></div><h1>Control de Comidas</h1><p>Ingresa para solicitar y consultar tu consumo.</p>
 <form onSubmit={entrar}><label>Correo electrónico</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="correo@ejemplo.com"/>
 <label>Contraseña</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/>
 <button className="primary" disabled={busy}>{busy?'Ingresando...':'Ingresar'}</button></form>
 <button className="link-btn" onClick={recuperar}>¿Olvidaste tu contraseña?</button>{msg&&<div className="message">{msg}</div>}</div></div>
}
