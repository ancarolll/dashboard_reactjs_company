import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import { faSun } from '@fortawesome/free-regular-svg-icons'
import '../styles/main.css';


const HeaderComponents = () => {
  return (
    <div>
    {/* Header */}
    <header className="bg-(--white-tar-color) text-right p-3 shadow-md rounded">
      <a href="#">
        <FontAwesomeIcon icon={faBell} className='text-lg px-6 text-(--ash-60-oppacity)'/>
      </a>
      <a href="">
      <FontAwesomeIcon icon={faSun} className='text-lg text-(--ash-60-oppacity)'/>
      </a>
        </header>
    </div>
  )
}

export default HeaderComponents