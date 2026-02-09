export default function UserInfo(props){
    return (
        <>
        <h2>{props.name}</h2>
        <h4>{props.course}</h4>
        <p>{props.children}</p>
        </>
    )
}


// export default function UserInfo({name,course}){
//     return (
//         <>
//         <h2>{name}</h2>
//         <h3>{course}</h3>
//         </>
//     )
// }