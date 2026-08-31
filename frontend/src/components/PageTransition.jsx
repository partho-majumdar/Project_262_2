// import React from 'react'
// import { motion } from 'framer-motion'
// import { useLocation } from 'react-router-dom'

// const variants = {
//   initial: {
//     opacity: 0,
//     scale: 0.98,
//     y: 12,
//   },
//   animate: {
//     opacity: 1,
//     scale: 1,
//     y: 0,
//     transition: {
//       duration: 0.4,
//       ease: [0.22, 1, 0.36, 1],
//     },
//   },
//   exit: {
//     opacity: 0,
//     scale: 1.01,
//     y: -8,
//     transition: {
//       duration: 0.25,
//       ease: [0.4, 0, 1, 1],
//     },
//   },
// }

// export default function PageTransition({ children }) {
//   const location = useLocation()

//   return (
//     <motion.div
//       key={location.pathname}
//       variants={variants}
//       initial="initial"
//       animate="animate"
//       exit="exit"
//       style={{
//         width: '100%',
//         minHeight: '100vh',
//         backgroundColor: '#10131a',
//       }}
//     >
//       {children}
//     </motion.div>
//   )
// }