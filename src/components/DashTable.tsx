import { useState, useEffect } from "react";

export type TableFilter = Array<[string, JSX.Element]>;
export type TableData = Array<TableRow>;
export interface TableRow {
  data: Array<ColData>;
  className?: string;
}
export interface ColData {
  value: any;
  sort_value: any;
  className?: string;
}

export const DashTable = ({
  id,
  title,
  filter,
  cols,
  data,
  className
}: {
  id?: any;
  title: string;
  filter?: TableFilter;
  cols: Array<string>;
  data?: TableData;
  className?: string;
}) => {
  const [sort_col, setSortCol] = useState<null | number>(null);
  const [sort_asc, setSortAsc] = useState(true);

  useEffect(() => {
    setSortCol(null);
    setSortAsc(true);
  }, [id]);

  if (sort_col !== null && data) {
    data.sort((x, y) => {
      let result;
      const xc = x.data[sort_col];
      const yc = y.data[sort_col];
      const xval = xc.sort_value === undefined ? xc.value : xc.sort_value;
      const yval = yc.sort_value === undefined ? yc.value : yc.sort_value;
      if (xval < yval) {
        result = 1;
      } else if (xval > yval) {
        result = -1;
      } else {
        result = 0;
      }
      if (sort_asc) {
        result *= -1;
      }
      return result;
    });
  }

  const handleColClick = (cn: number) => {
    if (sort_col === cn) {
      setSortAsc(!sort_asc);
    } else {
      setSortAsc(true);
      setSortCol(cn);
    }
  };

  return (
    <div className="dashboard-main-content-block_table">
      {title ? <div className="heading-h2">{title}</div> : null}
      <div className={`dashboard-main-content-block__content ${className}`}>
        {filter ? (
          <div className="filter-form">
            {filter.map(([n, f], index) => {
              return (
                <div key={index}>
                  <label>
                    {n}
                    {f}
                  </label>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="filter-empty"></div>
        )}
        <div className="dashboard-table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                {cols.map((col, index) => {
                  let col_arrow;
                  if (index == sort_col) {
                    col_arrow = sort_asc ? "⬇" : "⬆";
                  }
                  return (
                    <th
                      className="sortable"
                      onClick={() => handleColClick(index)}
                      key={col}
                    >
                      {col}
                      {col_arrow}
                    </th>
                  );
                })}
              </tr>
            </thead>
            {data ? (
              <tbody>
                {data.map((row: TableRow, index: number) => {
                  return (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#191D22" : "#121721"
                      }}
                      className={row.className}
                    >
                      {row.data.map((col, index) => {
                        return (
                          <td key={`c${index}`} className={col?.className}>
                            {col?.value}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
};
