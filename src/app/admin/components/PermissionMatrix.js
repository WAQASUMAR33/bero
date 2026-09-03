import React from 'react';

const PermissionMatrix = ({ selectedPermissions = [], onChange, readOnly = false }) => {
    const modules = [
        { name: 'Staff Management', key: 'users', actions: ['create', 'update', 'delete'] },
        { name: 'Service Users', key: 'service_seekers', actions: ['create', 'update', 'delete'] },
        { name: 'Rota & Shifts', key: 'shifts', actions: ['create', 'update', 'delete'] },
        { name: 'Care Tasks', key: 'care_tasks', actions: ['create', 'update', 'delete'] },
        { name: 'Holidays', key: 'holidays', actions: ['create', 'update', 'delete'] },
        { name: 'Policies', key: 'policies', actions: ['create', 'update', 'delete'] },
        { name: 'Finance', key: 'finance', actions: ['create', 'update', 'delete'] },
        { name: 'Settings', key: 'settings', actions: ['update'] },
        { name: 'Reports', key: 'reports', actions: ['create', 'delete'] }, // View is default
        { name: 'Feedback Monitoring', key: 'quality-assurance', actions: ['create', 'update', 'delete'] },
        { name: 'Maintenance', key: 'maintenance', actions: ['create', 'update', 'delete'] },
    ];

    const handleToggle = (permissionKey) => {
        if (readOnly) return;

        const newPermissions = selectedPermissions.includes(permissionKey)
            ? selectedPermissions.filter(p => p !== permissionKey)
            : [...selectedPermissions, permissionKey];

        onChange(newPermissions);
    };

    const handleToggleRow = (moduleKey, actions) => {
        if (readOnly) return;

        const allModulePermissions = actions.map(action => `${moduleKey}.${action}`);
        const allSelected = allModulePermissions.every(p => selectedPermissions.includes(p));

        let newPermissions = [...selectedPermissions];
        if (allSelected) {
            // Unselect all
            newPermissions = newPermissions.filter(p => !allModulePermissions.includes(p));
        } else {
            // Select all (add missing ones)
            allModulePermissions.forEach(p => {
                if (!newPermissions.includes(p)) newPermissions.push(p);
            });
        }
        onChange(newPermissions);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Permission Settings</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Configure access rights for this user. All users have default <strong>View</strong> access to these modules.
                    Select the specific <strong>Write</strong> actions allowed.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                Module
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Create
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Update / Edit
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Delete
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                All Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {modules.map((module) => {
                            const allModulePermissions = module.actions.map(a => `${module.key}.${a}`);
                            const allSelected = allModulePermissions.every(p => selectedPermissions.includes(p));

                            return (
                                <tr key={module.key} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {module.name}
                                    </td>

                                    {/* Create Action */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {module.actions.includes('create') ? (
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(`${module.key}.create`)}
                                                onChange={() => handleToggle(`${module.key}.create`)}
                                                disabled={readOnly}
                                                className="h-4 w-4 text-[#224fa6] focus:ring-[#224fa6] border-gray-300 rounded cursor-pointer"
                                            />
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>

                                    {/* Update Action */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {module.actions.includes('update') ? (
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(`${module.key}.update`)}
                                                onChange={() => handleToggle(`${module.key}.update`)}
                                                disabled={readOnly}
                                                className="h-4 w-4 text-[#224fa6] focus:ring-[#224fa6] border-gray-300 rounded cursor-pointer"
                                            />
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>

                                    {/* Delete Action */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {module.actions.includes('delete') ? (
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(`${module.key}.delete`)}
                                                onChange={() => handleToggle(`${module.key}.delete`)}
                                                disabled={readOnly}
                                                className="h-4 w-4 text-[#224fa6] focus:ring-[#224fa6] border-gray-300 rounded cursor-pointer"
                                            />
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>

                                    {/* Toggle All */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleRow(module.key, module.actions)}
                                            disabled={readOnly}
                                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${allSelected
                                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {allSelected ? 'Unselect All' : 'Select All'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PermissionMatrix;
