import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Pencil, Trash2, AlertCircle, UserCheck, UserX, Search } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "http://nuriddin777.uz/api/auth/";
const API_USERS_URL = `${API_BASE_URL}users/`;
const API_ROLES_URL = `${API_BASE_URL}roles/`;
// const API_PROFILES_URL = `${API_BASE_URL}profiles/`; // BU ENDI KERAKMAS

interface Role {
  id: number;
  name: string;
  description?: string;
}

interface Profile {
  id?: number;
  full_name: string;
  phone_number: string | null;
  role: Role | number; 
  salary: string | null;
  address: string;
  salary_status?: string | null;
}

interface Employee {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile: Profile;
  is_active?: boolean;
  is_staff?: boolean;
  date_joined?: string;
  status?: "Faol" | "Faol emas";
}

interface NewEmployeeFormData {
  username: string;
  email?: string;
  password?: string;
  password2?: string;
  full_name: string;
  phone_number?: string | null;
  role_id: number;
  salary?: string | null;
  address?: string;
  is_staff?: boolean;
}

interface EditEmployeeFormData extends Omit<NewEmployeeFormData, 'password' | 'password2'> {
    is_active: boolean;
}

interface ApiListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  const fetchRoles = useCallback(async (token: string) => {
    try {
      const response = await axios.get<ApiListResponse<Role>>(API_ROLES_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data.results || []);
    } catch (error) {
      console.error("Rollarni yuklashda xatolik:", error);
      toast.error("Rollarni yuklashda xatolik yuz berdi.");
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya qilinmagan. Tizimga kiring.");
        navigate("/login");
        setIsLoading(false);
        return;
      }
      
      if (roles.length === 0) {
          await fetchRoles(token);
      }

      const response = await axios.get<ApiListResponse<Employee>>(API_USERS_URL, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });

      const fetchedEmployees = response.data.results.map((user) => ({
        ...user,
        status: user.is_active ? "Faol" : "Faol emas",
      }));

      setEmployees(fetchedEmployees.sort((a,b) => b.id - a.id));
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error("Sessiya muddati tugagan. Tizimga qayta kiring.");
        navigate("/login");
      } else if (err.code === "ECONNABORTED") {
        toast.error("Serverga ulanishda vaqt tugadi.");
      } else {
        toast.error("Ma'lumotlarni yuklashda xatolik: " + (err.response?.data?.detail || err.message || "Noma'lum xatolik"));
      }
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, fetchRoles, roles.length]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddEmployee = async (data: NewEmployeeFormData) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Avtorizatsiya tokeni topilmadi");

      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        password2: data.password2,
        is_staff: data.is_staff || false,
        full_name: data.full_name,
        phone_number: data.phone_number,
        role_id: data.role_id, // <-- mana shu
        salary: data.salary,
        address: data.address,
      };
      await axios.post<Employee>(API_USERS_URL, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      await fetchEmployees(); 
      setIsAddModalOpen(false);
      toast.success(`"${data.username}" nomli hodim muvaffaqiyatli qo'shildi!`);
    } catch (err: any) {
      let errorMessage = "Hodim qo‘shishda xatolik: ";
      if (err.response?.data && typeof err.response.data === 'object') {
        for (const key in err.response.data) {
          let errorDetail = err.response.data[key];
          if (key === 'profile' && typeof errorDetail === 'object' && errorDetail !== null) {
             for (const subKey in errorDetail) {
                 errorMessage += `Profile ${subKey}: ${Array.isArray(errorDetail[subKey]) ? errorDetail[subKey].join(', ') : errorDetail[subKey]}. `;
            }
          } else if (key === 'role' && Array.isArray(errorDetail)) {
            errorMessage += `Lavozim: ${errorDetail.join(', ')}. `;
          }
          else {
             errorMessage += `${key}: ${Array.isArray(errorDetail) ? errorDetail.join(', ') : errorDetail}. `;
          }
        }
      } else {
        errorMessage += err.message || "Noma'lum server xatosi.";
      }
      toast.error(errorMessage, { duration: 10000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEmployee = async (data: EditEmployeeFormData) => {
    if (!selectedEmployee) {
        toast.error("Tahrirlash uchun hodim tanlanmagan.");
        return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Avtorizatsiya tokeni topilmadi");

      const payload = {
        username: data.username,
        email: data.email,
        is_active: data.is_active,
        is_staff: data.is_staff,
        // Profile ma'lumotlari to'g'ridan-to'g'ri yuboriladi
        full_name: data.full_name,       
        phone_number: data.phone_number, 
        role: data.role_id, // Bu role IDsi bo'lishi kerak
        salary: data.salary,
        address: data.address,
      };

      await axios.put<Employee>(`${API_USERS_URL}${selectedEmployee.id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchEmployees(); 
      setIsEditModalOpen(false);
      toast.success(`"${data.username}" ma'lumotlari yangilandi!`);
    } catch (err: any) {
      let errorMessage = "Hodimni tahrirlashda xatolik: ";
       if (err.response?.data && typeof err.response.data === 'object') {
        for (const key in err.response.data) {
          let errorDetail = err.response.data[key];
          if (key === 'profile' && typeof errorDetail === 'object' && errorDetail !== null) { 
             for (const subKey in errorDetail) {
                 errorMessage += `Profile ${subKey}: ${Array.isArray(errorDetail[subKey]) ? errorDetail[subKey].join(', ') : errorDetail[subKey]}. `;
            }
          } else if (key === 'role' && Array.isArray(errorDetail)) {
            errorMessage += `Lavozim: ${errorDetail.join(', ')}. `;
          }
           else {
             errorMessage += `${key}: ${Array.isArray(errorDetail) ? errorDetail.join(', ') : errorDetail}. `;
          }
        }
      } else if (err.response?.status === 404) {
        errorMessage = `Hodimni tahrirlashda xatolik: Resurs topilmadi (404). URL: ${API_USERS_URL}${selectedEmployee?.id}/`;
      }
      else {
        errorMessage += err.message || "Noma'lum server xatosi.";
      }
      toast.error(errorMessage, { duration: 10000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Avtorizatsiya tokeni topilmadi");
        setIsSubmitting(false);
        return;
      }

      await axios.delete(`${API_USERS_URL}${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      setIsDeleteModalOpen(false);
      toast.success(`Hodim muvaffaqiyatli o'chirildi.`);
    } catch (err: any) {
      toast.error("Hodimni o‘chirishda xatolik: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const filteredEmployees = employees.filter(employee => 
    employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.profile?.full_name && employee.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.profile?.phone_number && employee.profile.phone_number.includes(searchTerm))
  );

  return (
    <div className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-200">
          Hodimlar
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 whitespace-nowrap"
            >
            <Plus className="w-5 h-5 mr-1.5 -ml-1" /> Hodim qo'shish
            </button>
        </div>
      </header>

       {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
          <p className="ml-3 text-gray-600 dark:text-gray-400">Yuklanmoqda...</p>
        </div>
      ) : filteredEmployees.length === 0 && !isLoading ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <UserX className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-lg text-gray-500 dark:text-gray-400">
                {searchTerm ? "Qidiruv bo'yicha hodim topilmadi." : "Hozircha hodimlar mavjud emas."}
            </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  {["#", "F.I.Sh.", "Username", "Telefon", "Lavozimi", "Oylik", "Manzil", "Holati", "Amallar"].map((head) => (
                    <th key={head} scope="col" className="px-5 py-3 whitespace-nowrap">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 text-gray-700 dark:text-gray-200">{employee.profile?.full_name || employee.username}</td>
                    <td className="px-5 py-4">{employee.username}</td>
                    <td className="px-5 py-4">{employee.profile?.phone_number || "-"}</td>
                    <td className="px-5 py-4">
                        {employee.profile?.role && typeof employee.profile.role === 'object' 
                         ? employee.profile.role.name 
                         : (roles.find(r => r.id === employee.profile?.role)?.name || "-")
                        }
                    </td>
                    <td className="px-5 py-4">{employee.profile?.salary || "-"}</td>
                    <td className="px-5 py-4 truncate max-w-xs">{employee.profile?.address || "-"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 inline-flex items-center text-xs font-semibold rounded-full ${
                          employee.is_active
                            ? "bg-green-100 text-green-600 dark:bg-green-600/20 dark:text-green-400"
                            : "bg-red-100 text-red-600 dark:bg-red-600/20 dark:text-red-400"
                        }`}
                      >
                        {employee.is_active ? <UserCheck className="w-3 h-3 mr-1"/> : <UserX className="w-3 h-3 mr-1"/>}
                        {employee.is_active ? "Faol" : "Faol emas"}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => { setSelectedEmployee(employee); setIsEditModalOpen(true); }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-700/30 rounded-md"
                          title="Tahrirlash"
                        > <Pencil className="w-4 h-4" /> </button>
                        <button
                          onClick={() => { setSelectedEmployee(employee); setIsDeleteModalOpen(true); }}
                          className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-700/30 rounded-md"
                          title="O'chirish"
                        > <Trash2 className="w-4 h-4" /> </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-3">
              Yangi Hodim Qo'shish
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data: NewEmployeeFormData = {
                  username: (form.elements.namedItem("username_add") as HTMLInputElement).value,
                  email: (form.elements.namedItem("email_add") as HTMLInputElement).value,
                  password: (form.elements.namedItem("password_add") as HTMLInputElement).value,
                  password2: (form.elements.namedItem("password2_add") as HTMLInputElement).value,
                  full_name: (form.elements.namedItem("full_name_add") as HTMLInputElement).value,
                  phone_number: (form.elements.namedItem("phone_number_add") as HTMLInputElement).value || null,
                  role_id: parseInt((form.elements.namedItem("role_id_add") as HTMLSelectElement).value),
                  salary: (form.elements.namedItem("salary_add") as HTMLInputElement).value || null,
                  address: (form.elements.namedItem("address_add") as HTMLInputElement).value || "",
                  is_staff: (form.elements.namedItem("is_staff_add") as HTMLInputElement).checked,
                };
                handleAddEmployee(data);
              }}
              className="space-y-4"
            >
              {[
                { name: "username_add", label: "Username", type: "text", placeholder:"foydalanuvchi_nomi", required: true },
                { name: "email_add", label: "Email", type: "email", placeholder:"email@example.com", required: true },
                { name: "password_add", label: "Parol", type: "password", placeholder:"••••••••", required: true },
                { name: "password2_add", label: "Parolni Tasdiqlang", type: "password", placeholder:"••••••••", required: true },
                { name: "full_name_add", label: "To'liq Ism (F.I.Sh.)", type: "text", placeholder:"Aliev Vali G'anievich", required: true },
                { name: "phone_number_add", label: "Telefon Raqami", type: "tel", placeholder:"+998 XX XXX XX XX" },
                { name: "salary_add", label: "Oylik (sum)", type: "text", placeholder:"5000000" },
                { name: "address_add", label: "Manzil", type: "text", placeholder:"Toshkent sh." },
              ].map(field => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                  <input id={field.name} name={field.name} type={field.type} placeholder={field.placeholder} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200" required={field.required}/>
                </div>
              ))}
              <div>
                  <label htmlFor="role_id_add" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Lavozimi <span className="text-red-500">*</span></label>
                  <select id="role_id_add" name="role_id_add" className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200" required>
                      <option value="" disabled selected>Lavozimni tanlang</option>
                      {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
              </div>
              <div className="flex items-center pt-2">
                  <input id="is_staff_add" name="is_staff_add" type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <label htmlFor="is_staff_add" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Admin huquqi</label>
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t dark:border-gray-700 mt-5">
                <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">
                  Bekor Qilish
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 border-b dark:border-gray-700 pb-3">
              Hodim Ma'lumotlarini Tahrirlash
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data: EditEmployeeFormData = {
                  username: (form.elements.namedItem("username_edit") as HTMLInputElement).value,
                  email: (form.elements.namedItem("email_edit") as HTMLInputElement).value,
                  full_name: (form.elements.namedItem("full_name_edit") as HTMLInputElement).value,
                  phone_number: (form.elements.namedItem("phone_number_edit") as HTMLInputElement).value || null,
                  role_id: parseInt((form.elements.namedItem("role_id_edit") as HTMLSelectElement).value),
                  salary: (form.elements.namedItem("salary_edit") as HTMLInputElement).value || null,
                  address: (form.elements.namedItem("address_edit") as HTMLInputElement).value || "",
                  is_active: (form.elements.namedItem("status_edit") as HTMLSelectElement).value === "Faol",
                  is_staff: (form.elements.namedItem("is_staff_edit") as HTMLInputElement).checked,
                };
                handleEditEmployee(data);
              }}
              className="space-y-4"
            >
              {[
                { name: "username_edit", label: "Username", type: "text", defaultValue: selectedEmployee.username, required: true },
                { name: "email_edit", label: "Email", type: "email", defaultValue: selectedEmployee.email, required: true },
                { name: "full_name_edit", label: "To'liq Ism (F.I.Sh.)", type: "text", defaultValue: selectedEmployee.profile?.full_name, required: true },
                { name: "phone_number_edit", label: "Telefon Raqami", type: "tel", defaultValue: selectedEmployee.profile?.phone_number },
                { name: "salary_edit", label: "Oylik (sum)", type: "text", defaultValue: selectedEmployee.profile?.salary },
                { name: "address_edit", label: "Manzil", type: "text", defaultValue: selectedEmployee.profile?.address },
              ].map(field => (
                <div key={field.name}>
                  <label htmlFor={field.name} className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{field.label} {field.required && <span className="text-red-500">*</span>}</label>
                  <input id={field.name} name={field.name} type={field.type} defaultValue={field.defaultValue || ""} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200" required={field.required}/>
                </div>
              ))}
               <div>
                  <label htmlFor="role_id_edit" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Lavozimi <span className="text-red-500">*</span></label>
                  <select 
                    id="role_id_edit" 
                    name="role_id_edit" 
                    defaultValue={
                        selectedEmployee.profile?.role 
                        ? (typeof selectedEmployee.profile.role === 'number' 
                            ? selectedEmployee.profile.role 
                            : selectedEmployee.profile.role.id) 
                        : ""} 
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200" required>
                      <option value="" disabled>Lavozimni tanlang</option>
                      {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                 <div>
                    <label htmlFor="status_edit" className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Holati</label>
                    <select id="status_edit" name="status_edit" defaultValue={selectedEmployee.status} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-gray-200" required>
                        <option value="Faol">Faol</option>
                        <option value="Faol emas">Faol emas</option>
                    </select>
                </div>
                <div className="flex items-end pb-1">
                    <input id="is_staff_edit" name="is_staff_edit" type="checkbox" defaultChecked={selectedEmployee.is_staff} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="is_staff_edit" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Admin huquqi</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-3 border-t dark:border-gray-700 mt-5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">
                  Bekor Qilish
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center">
                   {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md text-center transform transition-all">
             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-5" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              Hodimni O'chirishni Tasdiqlang
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Haqiqatan ham <strong className="font-medium text-gray-700 dark:text-gray-200">{selectedEmployee.profile?.full_name || selectedEmployee.username}</strong> nomli hodimni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 disabled:opacity-50">
                Bekor Qilish
              </button>
              <button onClick={() => { if(selectedEmployee) handleDeleteEmployee(selectedEmployee.id);}} disabled={isSubmitting} className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 disabled:bg-red-400 flex items-center justify-center">
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Ha, O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;