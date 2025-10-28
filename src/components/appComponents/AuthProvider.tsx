import {type JSX} from 'react'
import { useNavigate } from 'react-router';

interface Props<T> {
    input?: (props: T) => JSX.Element; 
    inputProps?: Props<T>; 
}

export default function AuthProvider<T>(props : Props<T>) {

    const navigate = useNavigate()

    if(true){
    return (
    <div style={{backgroundColor: 'lightgray', padding: 20}}>
        {props.children}
    </div>
    );
    }

    else{
        navigate('/login')
    }
};