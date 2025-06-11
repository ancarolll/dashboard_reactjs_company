import '../styles/main.css';

const FooterComponents = () => {
  return (
    <div className='bg-(--background-tar-color) text-xs'>
      <footer className="flex justify-center space-x-5 text-(--ash-60-oppacity) text-center p-4">
          <p>&copy; 2025 Made</p>
          <p className='flex space-x-2'>
            <span>Distributed By </span>
            <span className='text-(--tar-color)'>PT Timur Adi Raya</span>
          </p>
      </footer>
    </div>
  )
}

export default FooterComponents