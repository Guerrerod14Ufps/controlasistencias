import React, { useEffect, useState } from "react";

function actualizarCelda(row, col, currentValue) {
  const newValue = Number(currentValue) + 1;
  const url = `https://script.google.com/macros/s/AKfycbxxGFVgQePQ90nZK5ba0VicExT39a2ZGZInUE8-sYBMMFEoAEQ6oEYYyYbQgYuGLflNQw/exec?row=${row}&col=${col}&value=${newValue}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log(`Celda actualizada correctamente: ${newValue}`);
      } else {
        console.error("Error al actualizar: ", data.message);
      }
    })
    .catch(error => console.error("Error en la solicitud:", error));
}

function actualizarFirmaDia(codProfesor, dia) {
  const url = `https://script.google.com/macros/s/AKfycbzrnAfLPNbClv-798PdM8avJEX_W5Ns5i-6EV1eQGhnX33ZQ0PrNvGY7TV4Wf9a01_VKw/exec?codProfesor=${codProfesor}&dia=${dia}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log(`Firma del día ${dia} actualizada correctamente para el profesor ${codProfesor}`);
      } else {
        console.error("Error al actualizar la firma: ", data.message);
      }
    })
    .catch(error => console.error("Error en la solicitud:", error));
}

const App = () => {
  const [profesores, setProfesores] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [detalleHorarios, setDetalleHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [horaInicioSeleccionada, setHoraInicioSeleccionada] = useState("");
  const [horaFinSeleccionada, setHoraFinSeleccionada] = useState("");
  

  const horariosFiltrados = detalleHorarios
  .filter((item) => {
    const cumpleDia = diaSeleccionado ? Number(item.dia) === Number(diaSeleccionado) : true;
    const cumpleHoraInicio = horaInicioSeleccionada ? Number(item.horaInicio) >= Number(horaInicioSeleccionada) : true;
    const cumpleHoraFin = horaFinSeleccionada ? Number(item.horaFin) <= Number(horaFinSeleccionada) : true;

    let repetido = false;
    for (var x of horarios) {
      if (x.codProfesor === item.codProfesor && x.codHorarios.includes(item.codHorario)) {
        repetido = (
          (item.dia === 1 && x.firma1 === 1) ||
          (item.dia === 2 && x.firma2 === 1) ||
          (item.dia === 3 && x.firma3 === 1) ||
          (item.dia === 4 && x.firma4 === 1) ||
          (item.dia === 5 && x.firma5 === 1)
        );
      }
    }

    return cumpleDia && cumpleHoraInicio && cumpleHoraFin && !repetido;
  })
  .sort((a, b) => {
    // Ordenar primero por día (ascendente)
    if (a.dia !== b.dia) {
      return a.dia - b.dia;
    }
    // Luego por hora de inicio (ascendente)
    if (a.horaInicio !== b.horaInicio) {
      return Number(a.horaInicio) - Number(b.horaInicio);
    }
    // Finalmente por salón (alfabético)
    return a.salon.localeCompare(b.salon);
  });


  
  const handleFirmar = (codProfesor, dia, index) => {
    // Actualizar la firma en la hoja dos
    actualizarFirmaDia(codProfesor, dia);

    // Actualizar el estado local
    setDetalleHorarios((prevState) =>
      prevState.map((horario, i) =>
        i === index ? { ...horario, firmas: Number(horario.firmas) + 1 } : horario
      )
    );

    // Recargar la página si el profesor llega a 2 firmas
    if (Number(detalleHorarios[index].firmas) + 1 === 2) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  useEffect(() => {
  const fetchData = async () => {
    try {
      const [resProf, resHor, resDet] = await Promise.all([
        fetch("https://script.google.com/macros/s/AKfycbx7-wx6q-lZrsq25YvWWYFtjhYpDcD7DzZujj8ZKLL2qNi-mRACLFJoT6r8J7VlBTUY5w/exec").then((res) => res.json()),
        fetch("https://script.google.com/macros/s/AKfycbymC2h6B4e5sZV2GJ_VpEp1ixajxMLF4B1o9fSPVlM0TbqdYFxmSzYvRtvoJyVjuF4Kyg/exec").then((res) => res.json()),
        fetch("https://script.google.com/macros/s/AKfycbyaOTQ8fx6yLoh5Vpgy2mzLLAR2A_zpxuy_zxxzFs57vvWUI_MqdE3TyKUvYvaWQPgSQQ/exec").then((res) => res.json()),
      ]);

      //console.log("Datos sin procesar:", { resProf, resHor, resDet });

      const profesoresMap = resProf.slice(1).map((row) => ({
        cod: row[0],
        nombre: row[1],
        firmas: row[2],
        celda: row[3],
      }));

      const horariosMap = resHor.slice(1).map((row) => ({
        codProfesor: row[0],
        codHorarios: row[1].split(",").map(Number),
        firma1: Number(row[2]),
        firma2: Number(row[3]),
        firma3: Number(row[4]),
        firma4: Number(row[5]),
        firma5: Number(row[6]),
      }));

      const detalleMap = resDet.slice(1).map((row) => ({
        codHorario: Number(row[0]),  // Asegurarse de que es un número
        dia: Number(row[1]),
        horaInicio: row[2],
        horaFin: row[3],
        salon: row[4],
      }));

      //console.log("Mapeados:", { profesoresMap, horariosMap, detalleMap });

      const datosCompletos = horariosMap.flatMap((horario) => {
        const profesor = profesoresMap.find((p) => p.cod === horario.codProfesor);
        if (!profesor || Number(profesor.firmas) >= 2) return [];

        return horario.codHorarios.map((codHor) => {
          const detalle = detalleMap.find((d) => d.codHorario === codHor);
          return {
            profesor: profesor.nombre,
            dia: detalle?.dia || "-",
            horaInicio: detalle?.horaInicio || "-",
            horaFin: detalle?.horaFin || "-",
            salon: detalle?.salon || "-",
            firmas: profesor.firmas,
            celda: profesor.celda,
            codProfesor: profesor.cod,
            codHorario: codHor,
          };
        });
      });

      //console.log("Datos completos:", datosCompletos);

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
    <div className="min-h-screen bg-gray-100 p-5 flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Horarios de Profesores</h1>
      <div className="mb-4 flex flex-wrap gap-4 justify-center">
  <select
    className="border p-2 rounded-lg shadow-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={diaSeleccionado}
    onChange={(e) => setDiaSeleccionado(e.target.value)}
  >
    <option value="">Todos los días</option>
    <option value="1">Lunes</option>
    <option value="2">Martes</option>
    <option value="3">Miércoles</option>
    <option value="4">Jueves</option>
    <option value="5">Viernes</option>
  </select>

  <select
    className="border p-2 rounded-lg shadow-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={horaInicioSeleccionada}
    onChange={(e) => setHoraInicioSeleccionada(e.target.value)}
  >
    <option value="">Desde</option>
    {[...Array(13)].map((_, i) => (
      <option key={i} value={i + 6}>
        {i + 6}
      </option>
    ))}
  </select>

  <select
    className="border p-2 rounded-lg shadow-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={horaFinSeleccionada}
    onChange={(e) => setHoraFinSeleccionada(e.target.value)}
  >
    <option value="">Hasta</option>
    {[...Array(13)].map((_, i) => (
      <option key={i} value={i + 6}>
        {i + 6}
      </option>
    ))}
  </select>
</div>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table className="w-full max-w-4xl border-collapse shadow-lg rounded-lg overflow-hidden">
  <thead>
    <tr className="bg-blue-600 text-white text-left">
      <th className="border px-4 py-2">Profesor</th>
      <th className="border px-4 py-2">Día</th>
      <th className="border px-4 py-2">Hora Inicio</th>
      <th className="border px-4 py-2">Hora Fin</th>
      <th className="border px-4 py-2">Salón</th>
      <th className="border px-4 py-2">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {horariosFiltrados.map((item, index) => (
      <tr key={index} className="border bg-white hover:bg-gray-100 transition">
        <td className="border px-4 py-2">{item.profesor}</td>
        <td className="border px-4 py-2">{item.dia}</td>
        <td className="border px-4 py-2">{item.horaInicio}</td>
        <td className="border px-4 py-2">{item.horaFin}</td>
        <td className="border px-4 py-2">{item.salon}</td>
        <td className="border px-4 py-2">
          <button
            onClick={() => {
              if (Number(item.firmas) < 2) {
                actualizarCelda(item.celda, 3, item.firmas);
                handleFirmar(item.codProfesor, item.dia + 1, index);
                setDetalleHorarios(prevState =>
                  prevState.map((horario, i) =>
                    i === index ? { ...horario, firmas: Number(horario.firmas) + 1 } : horario
                  )
                );
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }
            }}
            className={`px-3 py-1 rounded text-white transition ${
              Number(item.firmas) >= 2
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600"
            }`}
            disabled={Number(item.firmas) >= 2}
          >
            {Number(item.firmas) >= 2 ? "Firmado" : "FIRMA"}
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
)}
    </div>
  );
};

export default App;
