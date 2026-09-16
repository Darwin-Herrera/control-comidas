import { useState } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
export default function Perfil(){
 const {perfil}=useAuth();const [actual,setActual]=useState('');const [nueva,setNueva]=useState('');const [confirmar,setConfirmar]=useState('');const [msg,setMsg]=useState('')
 const cambiar=async(e)=>{e.preventDefault();if(nueva.length<8)return setMsg('La nueva contraseña debe tener al menos 8 caracteres.');if(nueva!==confirmar)return setMsg('Las contraseñas no coinciden.')
 const {error}=await supabase.auth.updateUser({password:nueva,current_password:actual});setMsg(error?error.message:'Contraseña actualizada correctamente.');if(!error){setActual('');setNueva('');setConfirmar('')}}
 return <Layout><div className="page narrow"><h1>Mi perfil</h1><div className="panel"><h3>Datos de cuenta</h3><p><b>Nombre:</b> {perfil?.nombre}</p><p><b>Correo:</b> {perfil?.correo}</p><p><b>Rol:</b> {perfil?.rol}</p></div>
 <form className="panel form" onSubmit={cambiar}><h3>Cambiar contraseña</h3><label>Contraseña actual</label><input type="password" value={actual} onChange={e=>setActual(e.target.value)} required/><label>Nueva contraseña</label><input type="password" value={nueva} onChange={e=>setNueva(e.target.value)} required/><label>Confirmar nueva contraseña</label><input type="password" value={confirmar} onChange={e=>setConfirmar(e.target.value)} required/><button className="primary">Actualizar contraseña</button>{msg&&<div className="message">{msg}</div>}</form></div></Layout>
}
