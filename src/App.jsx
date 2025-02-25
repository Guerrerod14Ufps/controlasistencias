import React, { useEffect, useState } from "react";

function actualizarCelda(row, col, newValue) {
  const url = `https://script.google.com/macros/s/AKfycbxxGFVgQePQ90nZK5ba0VicExT39a2ZGZInUE8-sYBMMFEoAEQ6oEYYyYbQgYuGLflNQw/exec?row=${row}&col=${col}&value=${encodeURIComponent(newValue)}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Celda actualizada correctamente en la fila " + row + " y columna " + col);
      } else {
        console.error("Error al actualizar: ", data.message);
      }
    })
    .catch(error => console.error("Error en la solicitud:", error));
}

const App = () => {
  const [profesores, setProfesores] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [detalleHorarios, setDetalleHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProf, resHor, resDet] = await Promise.all([
         fetch("https://script.google.com/macros/s/AKfycbx7-wx6q-lZrsq25YvWWYFtjhYpDcD7DzZujj8ZKLL2qNi-mRACLFJoT6r8J7VlBTUY5w/exec").then((res) => res.json()),
          fetch("https://script.google.com/macros/s/AKfycbymC2h6B4e5sZV2GJ_VpEp1ixajxMLF4B1o9fSPVlM0TbqdYFxmSzYvRtvoJyVjuF4Kyg/exec").then((res) => res.json()),
          fetch("https://script.google.com/macros/s/AKfycbyaOTQ8fx6yLoh5Vpgy2mzLLAR2A_zpxuy_zxxzFs57vvWUI_MqdE3TyKUvYvaWQPgSQQ/exec").then((res) => res.json()),
        ]);

        // Convertir datos en objetos manejables
        const profesoresMap = resProf.slice(1).map((row) => ({
          cod: row[0],
          nombre: row[1],
          firmas: row[2],
        }));

        const horariosMap = resHor.slice(1).map((row) => ({
          codProfesor: row[0],
          codHorarios: row[1].split(",").map(Number),
        }));

        const detalleMap = resDet.slice(1).map((row) => ({
          codHorario: row[0],
          dia: row[1],
          horaInicio: row[2],
          horaFin: row[3],
          salon: row[4],
        }));

        // Unir datos
        const datosCompletos = horariosMap.flatMap((horario) => {
          const profesor = profesoresMap.find((p) => p.cod === horario.codProfesor);
          return horario.codHorarios.map((codHor) => {
            const detalle = detalleMap.find((d) => d.codHorario === codHor);
            return {
              profesor: profesor ? profesor.nombre : "Desconocido",
              dia: detalle?.dia || "-",
              horaInicio: detalle?.horaInicio || "-",
              horaFin: detalle?.horaFin || "-",
              salon: detalle?.salon || "-",
            };
          });
        });

        setProfesores(profesoresMap);
        setHorarios(horariosMap);
        setDetalleHorarios(datosCompletos);
        setCargando(false);
      } catch (error) {
        console.error("Error al obtener datos", error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">Horarios de Profesores</h1>
      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Profesor</th>
              <th className="border px-4 py-2">Día</th>
              <th className="border px-4 py-2">Hora Inicio</th>
              <th className="border px-4 py-2">Hora Fin</th>
              <th className="border px-4 py-2">Salón</th>
            </tr>
          </thead>
          <tbody>
            {detalleHorarios.map((item, index) => (
              <tr key={index} className="border">
                <td className="border px-4 py-2">{item.profesor}</td>
                <td className="border px-4 py-2">{item.dia}</td>
                <td className="border px-4 py-2">{item.horaInicio}</td>
                <td className="border px-4 py-2">{item.horaFin}</td>
                <td className="border px-4 py-2">{item.salon}</td>
              </tr>
            ))}
          </tbody>
          <button onClick={()=>actualizarCelda(3,4,2)}>FIRMA</button>
        </table>
      )}<div>
      </div>
    </div>
  );
};

export default App;
