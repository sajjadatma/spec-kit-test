export default async function ProductDetail({params}:{params:Promise<{id:string}>}){const {id}=await params;return <main><h1>Product details</h1><p>{id}</p></main>}
