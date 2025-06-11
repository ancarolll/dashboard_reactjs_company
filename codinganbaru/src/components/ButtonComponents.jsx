const ButtonComponents = ({variant, children, onClick}) => {
    const baseClass = "px-4 py-2 rounded-md font-semibold transition duration-300";

    const variants = {
        primary: "bg-(--white-tar-color) w-60 btn-primary rounded",
        secondary:"bg-(--shading-tar-color) w-60 btn-primary rounded",
        back:"bg-(--shading-tar-color) w-30 btn-back rounded",
        prismall: "bg-(--white-tar-color) w-40 btn-primary rounded",
        prisview: "bg-(--shading-tar-color) w-40 btn-primary rounded",
        addempdata: "bg-(--button-tar-color) w-60 btn_addempdata rounded",
        login: "bg-(--tar-color) w-full border border-transparent rounded text-white text-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200",
        success: "bg-green-500 text-white hover:bg-green-600",
        danger: "bg-red-500 text-white w-60 rounded hover:bg-red-600",
        warning: "bg-yellow-500 text-black hover:bg-yellow-600",
        loginoly: "flex flex-col items-center justify-center p-2 border-4 rounded border-(--font-tar-maroon-color) hover:bg-(--shading-tar-color) transition-all"
    };

  return (
    <button className={`${baseClass} ${variants[variant] || variants.primary}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default ButtonComponents