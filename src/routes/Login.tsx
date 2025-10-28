import { useNavigate } from "react-router"

export default function Login() {
    const navigate = useNavigate()
    return (
        <>
            <div>
                Login LALALA
            </div>
            <button onClick={() => {navigate('/')}}>
                Navegar
            </button>
        </>
    )
}