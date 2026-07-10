function withNetSalary(row) {
    return {
        ...row,
        net_salary: Number(row.base_salary) + Number(row.bonus) - Number(row.deduction),
    };
}

module.exports = { withNetSalary };
