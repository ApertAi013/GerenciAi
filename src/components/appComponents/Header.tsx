import classes from 'Header.style.css'

interface HeaderProps {
    logo : any,
    items : Array<{name : string}>
}

export default function Header (HeaderProps : HeaderProps) {
    return (
        <>
        <div>
            {HeaderProps.items.map((i, index) => {
                return(
                <div key={index}>
                    {i.name}
                </div>)
            })}
        </div>
        </>
    )   
}