(function(){
  "use strict";

  /* ---------------- Tabs ---------------- */
  var tabBtns = document.querySelectorAll(".tab-btn");
  var panels = document.querySelectorAll(".tab-panel");
  tabBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      tabBtns.forEach(function(b){ b.classList.remove("active"); });
      panels.forEach(function(p){ p.classList.remove("active"); });
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  /* ---------------- Accordions ---------------- */
  document.querySelectorAll(".accordion-header").forEach(function(header){
    header.addEventListener("click", function(){
      header.parentElement.classList.toggle("open");
    });
  });

  /* ---------------- Año dropdown ---------------- */
  function populateAnio(selectId){
    var anioSelect = document.getElementById(selectId);
    var currentYear = new Date().getFullYear();
    var opt0 = document.createElement("option");
    opt0.value = ""; opt0.textContent = "Seleccione…";
    anioSelect.appendChild(opt0);
    for (var y = currentYear + 1; y >= currentYear - 5; y--){
      var opt = document.createElement("option");
      opt.value = y; opt.textContent = y;
      anioSelect.appendChild(opt);
    }
  }
  populateAnio("a1-anio");
  populateAnio("a2-anio");

  /* ---------------- Catálogos ---------------- */
  var COMBUSTIBLES = ["Diésel B5", "Gasolina 84", "Gasolina 90", "Gasolina 95", "GLP", "Otros"];
  var UNIDADES = ["gal", "m3", "L", "kg", "Otros"];
  var MINICENTRALES = ["Canta", "Yaso", "Otros"];
  var VEHICULOS = ["Camioneta", "Automóvil", "Motocicleta", "Camión", "Otros"];
  var TIPO_EXTINTOR = ["PQS", "CO2", "Otros"];
  var UNIDAD_EXTINTOR = ["kg", "lb", "unidad"];
  var SEDES = ["Canta", "Yaso", "Oficina Lima", "Otros"];
  var UNIDAD_ENERGIA = ["kWh", "MWh"];

  function makeSelect(options, placeholder){
    var sel = document.createElement("select");
    var ph = document.createElement("option");
    ph.value = ""; ph.textContent = placeholder || "Seleccione…";
    sel.appendChild(ph);
    options.forEach(function(o){
      var op = document.createElement("option");
      op.value = o; op.textContent = o;
      sel.appendChild(op);
    });
    return sel;
  }

  function makeField(labelText, inputEl){
    var wrap = document.createElement("div");
    wrap.className = "field";
    var label = document.createElement("label");
    label.textContent = labelText;
    wrap.appendChild(label);
    wrap.appendChild(inputEl);
    return wrap;
  }

  function makeNumberInput(placeholder){
    var input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "any";
    input.placeholder = placeholder || "0";
    return input;
  }

  /* ---------------- Row builders ---------------- */
  function addRow(containerId, fieldsConfig){
    var container = document.getElementById(containerId);
    var row = document.createElement("div");
    row.className = "row-item";

    fieldsConfig.forEach(function(cfg){
      var input;
      if (cfg.type === "select") input = makeSelect(cfg.options, cfg.placeholder);
      else input = makeNumberInput(cfg.placeholder);
      input.dataset.key = cfg.key;
      row.appendChild(makeField(cfg.label, input));
    });

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "row-remove";
    removeBtn.textContent = "✕";
    removeBtn.title = "Eliminar";
    removeBtn.addEventListener("click", function(){ row.remove(); });
    row.appendChild(removeBtn);

    container.appendChild(row);
  }

  function minicentralFields(){
    return [
      { key:"minicentral", label:"Minicentral", type:"select", options:MINICENTRALES },
      { key:"monto", label:"Cantidad", type:"number", placeholder:"Cantidad" },
      { key:"combustible", label:"Tipo de combustible", type:"select", options:COMBUSTIBLES },
      { key:"unidad", label:"Unidad de medida", type:"select", options:UNIDADES }
    ];
  }
  function unidadesFields(){
    return [
      { key:"vehiculo", label:"Tipo de vehículo", type:"select", options:VEHICULOS },
      { key:"monto", label:"Cantidad", type:"number", placeholder:"Cantidad" },
      { key:"combustible", label:"Tipo de combustible", type:"select", options:COMBUSTIBLES },
      { key:"unidad", label:"Unidad de medida", type:"select", options:UNIDADES }
    ];
  }
  function extintoresFields(){
    return [
      { key:"tipo_extintor", label:"Tipo de extintor", type:"select", options:TIPO_EXTINTOR },
      { key:"monto", label:"Cantidad recargada", type:"number", placeholder:"Cantidad" },
      { key:"unidad", label:"Unidad de medida", type:"select", options:UNIDAD_EXTINTOR }
    ];
  }
  function energiaFields(){
    return [
      { key:"sede", label:"Sede / Ubicación", type:"select", options:SEDES },
      { key:"monto", label:"Consumo eléctrico", type:"number", placeholder:"Consumo" },
      { key:"unidad", label:"Unidad de medida", type:"select", options:UNIDAD_ENERGIA }
    ];
  }

  document.querySelectorAll("[data-add]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var group = btn.dataset.add;
      if (group === "minicentral") addRow("rows-minicentral", minicentralFields());
      if (group === "unidades") addRow("rows-unidades", unidadesFields());
      if (group === "extintores") addRow("rows-extintores", extintoresFields());
      if (group === "energia") addRow("rows-energia", energiaFields());
    });
  });

  // Fila inicial en cada sección
  addRow("rows-minicentral", minicentralFields());
  addRow("rows-unidades", unidadesFields());
  addRow("rows-extintores", extintoresFields());
  addRow("rows-energia", energiaFields());

  /* ---------------- Envío a Google Sheets ---------------- */
  var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwH2B9alEBh9uCAklh77CSqe3JnhPj5jvOsIWaF8kr-TRaz_KXTBQns_Meh9jld70XRwQ/exec";

  var syncFrameCounter = 0;

  function sendToSheet(tabla, common, row){
    var payload = Object.assign({ tabla: tabla }, common, row);
    var frameName = "hc_pluz_sync_" + (syncFrameCounter++) + "_" + Date.now();

    var frame = document.createElement("iframe");
    frame.name = frameName;
    frame.style.display = "none";
    document.body.appendChild(frame);

    var form = document.createElement("form");
    form.method = "POST";
    form.action = GOOGLE_SCRIPT_URL;
    form.target = frameName;
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = "payload";
    input.value = JSON.stringify(payload);
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();

    setTimeout(function(){
      form.remove();
      frame.remove();
    }, 8000);
  }

  /* ---------------- Guardar ---------------- */
  function collectRows(containerId){
    var container = document.getElementById(containerId);
    var data = [];
    container.querySelectorAll(".row-item").forEach(function(row){
      var entry = {};
      row.querySelectorAll("[data-key]").forEach(function(input){
        entry[input.dataset.key] = input.value;
      });
      data.push(entry);
    });
    return data;
  }

  function bindGuardar(opts){
    document.getElementById(opts.btnId).addEventListener("click", function(){
      var nombre = document.getElementById(opts.prefix + "-nombre").value.trim();
      var apellido = document.getElementById(opts.prefix + "-apellido").value.trim();
      var anio = document.getElementById(opts.prefix + "-anio").value;
      var mes = document.getElementById(opts.prefix + "-mes").value;
      var statusEl = document.getElementById(opts.prefix + "-status");

      if (!nombre || !apellido || !anio || !mes){
        statusEl.textContent = "Completa nombre, apellido, año y mes antes de guardar.";
        statusEl.style.color = "#c62828";
        return;
      }

      var comun = {
        nombre: nombre,
        apellido: apellido,
        anio: anio,
        mes: mes,
        fecha_registro: new Date().toISOString()
      };

      var registro = Object.assign({ alcance: opts.alcance }, comun);
      Object.keys(opts.rows).forEach(function(key){
        var group = opts.rows[key];
        var rows = collectRows(group.containerId);
        registro[key] = rows;
        rows.forEach(function(row){
          sendToSheet(group.tabla, comun, group.map(row));
        });
      });

      var historial = JSON.parse(localStorage.getItem(opts.storageKey) || "[]");
      historial.push(registro);
      localStorage.setItem(opts.storageKey, JSON.stringify(historial));

      statusEl.textContent = "Registro guardado (" + nombre + " " + apellido + " – " + mes + " " + anio + ").";
      statusEl.style.color = "#3f8a34";
    });
  }

  bindGuardar({
    btnId: "a1-guardar",
    prefix: "a1",
    alcance: "Alcance 1",
    storageKey: "pluz_huella_alcance1",
    rows: {
      minicentral: {
        containerId: "rows-minicentral",
        tabla: "minicentral",
        map: function(r){
          return { minicentral: r.minicentral, cantidad: r.monto, tipo_combustible: r.combustible, unidad: r.unidad };
        }
      },
      unidades_propias: {
        containerId: "rows-unidades",
        tabla: "vehiculos",
        map: function(r){
          return { tipo_vehiculo: r.vehiculo, cantidad: r.monto, tipo_combustible: r.combustible, unidad: r.unidad };
        }
      },
      extintores: {
        containerId: "rows-extintores",
        tabla: "extintores",
        map: function(r){
          return { tipo_extintor: r.tipo_extintor, cantidad: r.monto, unidad: r.unidad };
        }
      }
    }
  });

  bindGuardar({
    btnId: "a2-guardar",
    prefix: "a2",
    alcance: "Alcance 2",
    storageKey: "pluz_huella_alcance2",
    rows: {
      energia: {
        containerId: "rows-energia",
        tabla: "energia",
        map: function(r){
          return { sede: r.sede, consumo: r.monto, unidad: r.unidad };
        }
      }
    }
  });

})();
