import { useState, useMemo, useEffect } from "react";
import { Car, Trash2, Pencil, Plus, Search, Upload, X } from "lucide-react";
import "./dynamic.css"

// ─── Types ─────────────────────────────────────────────────────────────────

type CarEntry = {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: "Automatic" | "Manual";
  fuelType: "Gasoline" | "Diesel" | "Electric";
  status: "Available" | "Sold";
  image?: string;
};

type InputForms = {
  brand: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
  transmission: "Automatic" | "Manual";
  fuelType: "Gasoline" | "Diesel" | "Electric";
  status: "Available" | "Sold";
  image?: File | null;
  imagePreview: string;
};

type ErrorForms = {
  brand: string;
  model: string;
  year: string;
  price: string;
  mileage: string;
};

type SortOption = "newest" | "oldest" | "price-high" | "price-low" | "mileage";
type FuelFilter = "All" | "Gasoline" | "Diesel" | "Electric";
type StatusFilter = "All" | "Available" | "Sold";

// ─── Constants ──────────────────────────────────────────────────────────────

const INITIAL_FORM: InputForms = {
  brand: "",
  model: "",
  year: "",
  price: "",
  mileage: "",
  transmission: "Automatic",
  fuelType: "Gasoline",
  status: "Available",
  image: null,
  imagePreview: "",
};

const ERROR_INITIAL: ErrorForms = {
  brand: "",
  model: "",
  year: "",
  price: "",
  mileage: "",
};

type CarApi = {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: "Automatic" | "Manual";
  fuel_type: "Gasoline" | "Diesel" | "Electric";
  status: "Available" | "Sold";
  image?: string | null;
};




// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtPrice = (n: number): string => "$" + n.toLocaleString("en-US");
const fmtMileage = (n: number): string => n.toLocaleString("en-US") + " km";

const FUEL_COLOR: Record<string, string> = {
  Gasoline: "#f59e0b",
  Diesel: "#818cf8",
  Electric: "#34d399",
};

// ─── Component ──────────────────────────────────────────────────────────────

function CrudDynamic() {
  const [cars, setCars] = useState<CarEntry[]>([]);
  const [forms, setForms] = useState<InputForms>(INITIAL_FORM);
  const [errors, setErrors] = useState<ErrorForms>(ERROR_INITIAL);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterFuel, setFilterFuel] = useState<FuelFilter>("All");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");






const loadCars = async () => {
  const res = await fetch(
    "https://car-inventory-backend-n8j2.onrender.com/cars",
  );
  const data: CarApi[] = await res.json();

  setCars(
    data.map((car) => ({
      id: car.id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage,
      transmission: car.transmission,
      fuelType: car.fuel_type,
      status: car.status,
      image: car.image ?? undefined,
    })),
  );
};


/* ─────────────────────────────────────────────
   INITIAL LOAD
───────────────────────────────────────────── */

useEffect(() => {
  let mounted = true;

  const init = async () => {
    if (!mounted) return;
    await loadCars();
  };

  init();

  return () => {
    mounted = false;
  };
}, []);


 const stats = useMemo(() => {
   const available = cars.filter((c) => c.status === "Available").length;
   const avgPrice = cars.length
     ? Math.round(cars.reduce((s, c) => s + c.price, 0) / cars.length)
     : 0;

   return { total: cars.length, available, avgPrice };
 }, [cars]);

 /* ─────────────────────────────────────────────
   FILTER + SORT
───────────────────────────────────────────── */

 const displayed = useMemo<CarEntry[]>(() => {
   let list = [...cars];

   if (search.trim()) {
     const q = search.toLowerCase();
     list = list.filter(
       (c) =>
         c.brand.toLowerCase().includes(q) || c.model.toLowerCase().includes(q),
     );
   }

   if (filterFuel !== "All")
     list = list.filter((c) => c.fuelType === filterFuel);

   if (filterStatus !== "All")
     list = list.filter((c) => c.status === filterStatus);

   switch (sortBy) {
     case "newest":
       list.sort((a, b) => b.year - a.year);
       break;
     case "oldest":
       list.sort((a, b) => a.year - b.year);
       break;
     case "price-high":
       list.sort((a, b) => b.price - a.price);
       break;
     case "price-low":
       list.sort((a, b) => a.price - b.price);
       break;
     case "mileage":
       list.sort((a, b) => a.mileage - b.mileage);
       break;
   }

   return list;
 }, [cars, search, filterFuel, filterStatus, sortBy]);

 /* ─────────────────────────────────────────────
   FORM HANDLERS
───────────────────────────────────────────── */

 const handleChange = (
   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
 ) => {
   const { name, value } = e.target;
   setForms((prev) => ({ ...prev, [name]: value }));
   if (name in errors) setErrors((prev) => ({ ...prev, [name]: "" }));
 };

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (!file) return;

   setForms((prev) => ({
     ...prev,
     image: file,
     imagePreview: URL.createObjectURL(file),
   }));
 };

 /* ─────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────── */

 const validate = (f: InputForms): boolean => {
   const e: ErrorForms = { ...ERROR_INITIAL };
   let valid = true;

   if (!f.brand.trim()) {
     e.brand = "Brand is required.";
     valid = false;
   } else if (/\d/.test(f.brand)) {
     e.brand = "Brand should not contain numbers.";
     valid = false;
   }

   if (!f.model.trim()) {
     e.model = "Model is required.";
     valid = false;
   }

   if (!f.year) {
     e.year = "Year is required.";
     valid = false;
   }

   if (!f.price || Number(f.price) <= 0) {
     e.price = "Enter a valid price.";
     valid = false;
   }

   if (f.mileage === "" || Number(f.mileage) < 0) {
     e.mileage = "Enter a valid mileage.";
     valid = false;
   }

   setErrors(e);
   return valid;
 };

 /* ─────────────────────────────────────────────
   MODAL CONTROLS
───────────────────────────────────────────── */

 const openAddModal = () => {
   setEditingId(null);
   setForms(INITIAL_FORM);
   setErrors(ERROR_INITIAL);
   setIsOpenModal(true);
 };

 const openEditModal = (id: number) => {
   const car = cars.find((c) => c.id === id);
   if (!car) return;

   setEditingId(id);
   setForms({
     brand: car.brand,
     model: car.model,
     year: String(car.year),
     price: String(car.price),
     mileage: String(car.mileage),
     transmission: car.transmission,
     fuelType: car.fuelType,
     status: car.status,
     image: null,
     imagePreview: car.image ?? "",
   });

   setErrors(ERROR_INITIAL);
   setIsOpenModal(true);
 };

 /* ─────────────────────────────────────────────
   SUBMIT (POST + PUT)
───────────────────────────────────────────── */

 const submitCar = async () => {
   if (!validate(forms)) return;

   const payload = {
     brand: forms.brand,
     model: forms.model,
     year: Number(forms.year),
     price: Number(forms.price),
     mileage: Number(forms.mileage),
     transmission: forms.transmission,
     fuel_type: forms.fuelType,
     status: forms.status,
     image: forms.imagePreview || null,
   };

   if (editingId === null) {
     await fetch("https://car-inventory-backend-n8j2.onrender.com/cars", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(payload),
     });
   } else {
     await fetch(
       `https://car-inventory-backend-n8j2.onrender.com/cars/${editingId}`,
       {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       },
     );
   }

   await loadCars();
   closeModal();
 };

 /* ─────────────────────────────────────────────
   DELETE
───────────────────────────────────────────── */

 
const confirmDelete = async () => {
  if (deleteId === null) return;

  await fetch(
    `https://car-inventory-backend-n8j2.onrender.com/cars/${deleteId}`,
    {
      method: "DELETE",
    },
  );

  await loadCars();
  setDeleteId(null);
};

 /* ───────────────────────────────────────────── */

 const closeModal = () => {
   setIsOpenModal(false);
   setEditingId(null);
   setErrors(ERROR_INITIAL);
   setForms(INITIAL_FORM);
 };

 const currentYear = new Date().getFullYear();



  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header ── */}
      <header className="app-header">
        <div>
          <h1 className="header-title">
            <span className="header-dot" />
            <Car size={18} /> Car Inventory
          </h1>
          <p className="header-sub">
            Manage your fleet — create, update, and track vehicles
          </p>
        </div>
        <button
          className="btn-add-vehicle"
          type="button"
          onClick={openAddModal}
        >
          <Plus size={16} /> Add Vehicle
        </button>
      </header>

      {/* ── Stats Bar ── */}
      <div className="stats-bar">
        {[
          { label: "Total Vehicles", value: stats.total },
          { label: "Available", value: stats.available },
          { label: "Sold", value: stats.total - stats.available },
          {
            label: "Avg. Price",
            value: stats.avgPrice ? fmtPrice(stats.avgPrice) : "—",
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="controls">
        <div className="search-wrap">
          <span className="search-icon">
            <Search size={15} />
          </span>
          <input
            className="search-input"
            placeholder="Search brand or model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="ctrl-select"
          value={filterFuel}
          onChange={(e) => setFilterFuel(e.target.value as FuelFilter)}
        >
          <option value="All">All Fuels</option>
          <option value="Gasoline">Gasoline</option>
          <option value="Diesel">Diesel</option>
          <option value="Electric">Electric</option>
        </select>

        <select
          className="ctrl-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
        >
          <option value="All">All Status</option>
          <option value="Available">Available</option>
          <option value="Sold">Sold</option>
        </select>

        <select
          className="ctrl-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price-high">Price: High → Low</option>
          <option value="price-low">Price: Low → High</option>
          <option value="mileage">Lowest Mileage</option>
        </select>

        <span className="result-count">
          {displayed.length} result{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Card Grid ── */}
      <div className="card-grid">
        {displayed.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">No vehicles found</div>
            <div className="empty-sub">
              {cars.length === 0
                ? "Add your first vehicle to get started 🚗"
                : "Try adjusting your search or filters."}
            </div>
          </div>
        ) : (
          displayed.map(
            ({
              id,
              brand,
              model,
              year,
              price,
              mileage,
              transmission,
              fuelType,
              status,
              image,
            }) => (
              <div key={id} className="car-card">
                <div className="card-img-wrap">
                  {image ? (
                    <img
                      src={image}
                      className="card-img"
                      alt={`${brand} ${model}`}
                    />
                  ) : (
                    <div className="card-no-img">
                      <Car size={32} />
                      <span>No image</span>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  <div className="card-top">
                    <div>
                      <div className="card-brand">{brand}</div>
                      <div className="card-model">
                        {model} · {year}
                      </div>
                    </div>
                    <span
                      className={`status-pill ${
                        status === "Available"
                          ? "status-available"
                          : "status-sold"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="card-price">{fmtPrice(price)}</div>

                  <div className="card-tags">
                    <span className="tag">
                      <span
                        className="tag-dot"
                        style={{ background: FUEL_COLOR[fuelType] }}
                      />
                      {fuelType}
                    </span>
                    <span className="tag">{transmission}</span>
                    <span className="tag">{fmtMileage(mileage)}</span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-edit"
                      type="button"
                      onClick={() => openEditModal(id)}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      className="btn-delete"
                      type="button"
                      onClick={() => setDeleteId(id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ),
          )
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {isOpenModal && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="form-modal">
            <h2 className="modal-title">
              {editingId ? "Edit Vehicle" : "Add New Vehicle"}
            </h2>
            <button className="modal-close" type="button" onClick={closeModal}>
              <X size={18} />
            </button>

            {/* Image upload */}
            <div className="img-upload-area">
              <label className="img-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
                {forms.imagePreview ? (
                  <img
                    src={forms.imagePreview}
                    className="img-preview"
                    alt="preview"
                  />
                ) : (
                  <>
                    <Upload size={26} />
                    <span>Click to upload image</span>
                  </>
                )}
              </label>
            </div>

            {/* Brand + Model */}
            <div className="form-grid-2">
              <div className="form-row">
                <label className="field-label">Brand *</label>
                <input
                  className={`field-input${errors.brand ? " error" : ""}`}
                  type="text"
                  name="brand"
                  value={forms.brand}
                  onChange={handleChange}
                  placeholder="e.g. Toyota"
                />
                {errors.brand && <p className="error-text">{errors.brand}</p>}
              </div>
              <div className="form-row">
                <label className="field-label">Model *</label>
                <input
                  className={`field-input${errors.model ? " error" : ""}`}
                  type="text"
                  name="model"
                  value={forms.model}
                  onChange={handleChange}
                  placeholder="e.g. Supra"
                />
                {errors.model && <p className="error-text">{errors.model}</p>}
              </div>
            </div>

            {/* Year + Price */}
            <div className="form-grid-2">
              <div className="form-row">
                <label className="field-label">Year *</label>
                <select
                  className={`field-select${errors.year ? " error" : ""}`}
                  name="year"
                  value={forms.year}
                  onChange={handleChange}
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 15 }, (_, i) => currentYear - i).map(
                    (y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ),
                  )}
                </select>
                {errors.year && <p className="error-text">{errors.year}</p>}
              </div>
              <div className="form-row">
                <label className="field-label">Price (USD) *</label>
                <input
                  className={`field-input${errors.price ? " error" : ""}`}
                  type="number"
                  name="price"
                  min="0"
                  value={forms.price}
                  onChange={handleChange}
                  placeholder="50000"
                />
                {errors.price && <p className="error-text">{errors.price}</p>}
              </div>
            </div>

            {/* Mileage */}
            <div className="form-row">
              <label className="field-label">Mileage (km) *</label>
              <input
                className={`field-input${errors.mileage ? " error" : ""}`}
                type="number"
                name="mileage"
                min="0"
                value={forms.mileage}
                onChange={handleChange}
                placeholder="0"
              />
              {errors.mileage && <p className="error-text">{errors.mileage}</p>}
            </div>

            {/* Transmission + Fuel */}
            <div className="form-grid-2">
              <div className="form-row">
                <label className="field-label">Transmission</label>
                <select
                  className="field-select"
                  name="transmission"
                  value={forms.transmission}
                  onChange={handleChange}
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
              <div className="form-row">
                <label className="field-label">Fuel Type</label>
                <select
                  className="field-select"
                  name="fuelType"
                  value={forms.fuelType}
                  onChange={handleChange}
                >
                  <option value="Gasoline">Gasoline</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div className="form-row">
              <label className="field-label">Status</label>
              <select
                className="field-select"
                name="status"
                value={forms.status}
                onChange={handleChange}
              >
                <option value="Available">Available</option>
                <option value="Sold">Sold</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" type="button" onClick={closeModal}>
                {editingId ? "Discard Changes" : "Cancel"}
              </button>
              <button className="btn-submit" type="button" onClick={submitCar}>
                {editingId ? "Save Changes" : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteId !== null && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}
        >
          <div className="delete-modal">
            <div className="delete-icon">🗑️</div>
            <div className="delete-title">Delete Vehicle?</div>
            <div className="delete-sub">
              This action is permanent and cannot be undone.
            </div>
            <div className="delete-actions">
              <button
                className="btn-delete-cancel"
                type="button"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                type="button"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CrudDynamic;
